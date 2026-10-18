import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId } from '@/lib/billing/plans'

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

  // Someone who already has their own active plan (and so their own
  // projects/billing) can't also become a pure team member — accepting
  // used to silently reassign them to the owner's account for billing/new-
  // project purposes (getTeamContext's primaryOwnerId), locking them out
  // of their own account's "Manage billing" button and routing new
  // projects they create to the wrong account. Refuse instead of letting
  // that happen quietly.
  const { data: ownProfile, error: ownProfileErr } = await admin.from('profiles')
    .select('plan_id, trial_ends_at').eq('id', user.id).maybeSingle()
  if (ownProfileErr) return NextResponse.json({ error: 'Could not check your account — please try again.' }, { status: 500 })
  if (effectivePlanId(ownProfile?.plan_id, ownProfile?.trial_ends_at) !== null) {
    return NextResponse.json({
      error: 'This Google account already has its own AlertGA4 plan. Accept this invite from a different Google account, or contact kontakt@bettersteps.pl.',
    }, { status: 409 })
  }

  const { error: updateErr } = await admin.from('team_members')
    .update({ member_id: user.id, accepted_at: new Date().toISOString() })
    .eq('id', invite.id)
  if (updateErr) return NextResponse.json({ error: 'Could not accept the invite — please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
