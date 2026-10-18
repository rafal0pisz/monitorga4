import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { getAccessibleOwnerIds } from '@/lib/team/access'
import { sendEmail } from '@/lib/email/resend'
import { renderProjectDeletedEmail } from '@/lib/email/projectDeleted'

// Routed through the server (instead of a direct browser
// `.from('projects').delete()`, which RLS alone would still allow for
// either the owner or an accepted team member) so everyone else who had
// access to the project can be told it's gone — without this, a shared
// project just vanishes from a team member's dashboard on next load with
// no explanation at all.
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const admin = createAdminClient()
  const { data: project } = await admin.from('projects').select('id, name, owner_id').eq('id', projectId).single()

  // 404, not 403 — same reasoning as the GA4 data routes: don't confirm a
  // project id the caller has no access to even exists.
  if (!project || !(await getAccessibleOwnerIds(user.id)).includes(project.owner_id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Gather who else can see this project before it's gone — every accepted
  // team member on the owner's account, plus the owner themselves (in case
  // a member is the one deleting it) — minus whoever is doing the deleting.
  const [{ data: members }, { data: ownerProfile }] = await Promise.all([
    admin.from('team_members').select('email').eq('owner_id', project.owner_id).not('accepted_at', 'is', null),
    admin.from('profiles').select('email').eq('id', project.owner_id).single(),
  ])
  const recipients = new Set<string>()
  for (const m of members ?? []) if (m.email) recipients.add(String(m.email).toLowerCase())
  if (ownerProfile?.email) recipients.add(String(ownerProfile.email).toLowerCase())
  if (user.email) recipients.delete(user.email.toLowerCase())

  const { error: delErr, count } = await admin.from('projects').delete({ count: 'exact' }).eq('id', projectId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (recipients.size > 0) {
    const actorEmail = user.email ?? 'A team member'
    // Fire-and-forget by design (sendEmail never throws) — the project is
    // already deleted at this point, a failed notification email must
    // never be reported back as "the delete failed".
    await Promise.all([...recipients].map(email =>
      sendEmail({ to: email, ...renderProjectDeletedEmail(project.name, actorEmail) })
    ))
  }

  return NextResponse.json({ ok: true })
}
