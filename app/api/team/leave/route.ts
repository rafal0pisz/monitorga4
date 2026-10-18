import { NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Self-service counterpart to app/api/team/remove (owner-only) — a member
// who wants their own plan/projects has no other way out: /api/team/accept
// refuses to let someone with their own active plan also be a member, and
// Billing/new-project creation are both routed to the team owner's account
// while a membership is active. Without this, leaving required asking the
// owner to remove them.
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error, count } = await admin.from('team_members')
    .delete({ count: 'exact' })
    .eq('member_id', user.id)
    .not('accepted_at', 'is', null)

  if (error) return NextResponse.json({ error: 'Could not leave the team — please try again.' }, { status: 500 })
  if (!count) return NextResponse.json({ error: "You're not on a team." }, { status: 404 })

  return NextResponse.json({ ok: true })
}
