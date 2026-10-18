import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()

  const { data: invite, error: inviteErr } = await admin.from('team_members')
    .select('id, owner_id, email, accepted_at').eq('invite_token', token).maybeSingle()
  if (inviteErr) return NextResponse.json({ error: 'Could not look up this invite — please try again.' }, { status: 500 })
  if (!invite) return NextResponse.json({ error: 'This invite link is invalid.' }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: 'This invite has already been accepted.' }, { status: 409 })

  // The link itself isn't secret-proof (it can end up forwarded, sit in a
  // shared inbox, etc.) — matching it against the invited email keeps a
  // leaked link from letting a different Google account claim this seat.
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: `This invite was sent to ${invite.email} — sign in with that Google account to accept it.` }, { status: 403 })
  }

  // v1 keeps membership to one team per person (no workspace switcher in
  // the UI yet) — block rather than silently create a dual membership that
  // nothing lets the person navigate.
  const { data: ownMembership, error: ownErr } = await admin.from('team_members')
    .select('owner_id').eq('member_id', user.id).not('accepted_at', 'is', null).maybeSingle()
  if (ownErr) return NextResponse.json({ error: 'Could not check your existing memberships — please try again.' }, { status: 500 })
  if (ownMembership && ownMembership.owner_id !== invite.owner_id) {
    return NextResponse.json({ error: "You're already part of another team — leave it first before accepting a new invite." }, { status: 409 })
  }

  // Having an own plan/projects doesn't conflict with also being a team
  // member — the dashboard, billing and new-project flows all keep "your
  // own account" and "this team" as two separate, independent contexts
  // (see src/lib/team/access.ts), so there's nothing to reconcile here.

  const { error: updateErr } = await admin.from('team_members')
    .update({ member_id: user.id, accepted_at: new Date().toISOString() })
    .eq('id', invite.id)
  if (updateErr) return NextResponse.json({ error: 'Could not accept the invite — please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
