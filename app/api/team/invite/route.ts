import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, canUseTeamFeature, maxMembersPerProject } from '@/lib/billing/plans'
import { MAX_TEAM_SEATS } from '@/lib/team/access'
import { sendEmail } from '@/lib/email/resend'
import { renderTeamInviteEmail } from '@/lib/email/teamInvite'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Only the Agency account itself can invite — not an already-invited member
// acting on its behalf (team_members has no "admin can also invite" path in
// v1, kept deliberately simple: one person decides who's on the team).
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  // Optional: set when inviting from a specific group's management UI
  // rather than the general Team page — the new member is granted this
  // one group immediately, instead of starting with access to nothing
  // until the owner grants one separately. Access is group-only now (see
  // src/lib/team/access.ts) — there's no per-project equivalent anymore.
  const groupId = typeof body.groupId === 'string' ? body.groupId : null
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile, error: profileErr } = await admin.from('profiles')
    .select('plan_id, trial_ends_at').eq('id', user.id).single()
  if (profileErr) {
    return NextResponse.json({ error: 'Could not check your plan — please try again.' }, { status: 500 })
  }
  const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
  if (!canUseTeamFeature(effective)) {
    return NextResponse.json({ error: 'Team members are available on the Pro and Agency plans.' }, { status: 403 })
  }

  // Verified up front — a bad groupId, or one already at this plan's
  // per-group member cap, must fail the whole invite rather than silently
  // create an unscoped team_members row the caller thinks is group-scoped.
  if (groupId) {
    const { data: group } = await admin.from('project_groups').select('id').eq('id', groupId).eq('owner_id', user.id).single()
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const cap = maxMembersPerProject(effective)
    const { count: grantedCount, error: grantedErr } = await admin
      .from('group_team_members').select('id', { count: 'exact', head: true }).eq('group_id', groupId)
    if (grantedErr) return NextResponse.json({ error: 'Could not check this group\'s team access — please try again.' }, { status: 500 })
    if ((grantedCount ?? 0) >= cap) {
      return NextResponse.json({ error: `Your plan allows up to ${cap} people per group. Remove someone from it first to add a new person.` }, { status: 409 })
    }
  }

  const { data: existing, error: existingErr } = await admin.from('team_members')
    .select('id').eq('owner_id', user.id)
  if (existingErr) {
    return NextResponse.json({ error: 'Could not check your team — please try again.' }, { status: 500 })
  }
  // Seats = the owner themselves + every invited row (pending or accepted) —
  // a pending invite counts against the limit too, so it can't be used to
  // queue up more invites than seats actually allow. Shared account-wide
  // ceiling for every plan that can use team features at all — the
  // per-project cap above is the tighter, plan-specific constraint for Pro.
  if (1 + (existing?.length ?? 0) >= MAX_TEAM_SEATS) {
    return NextResponse.json({ error: `Your plan includes up to ${MAX_TEAM_SEATS} seats (including you). Remove someone first to invite a new person.` }, { status: 409 })
  }

  // Catch the dead-end invite before it's ever sent — accept-time already
  // refuses this (app/api/team/accept), but without this check the owner
  // would only find out after the invitee clicks the link and hits a wall.
  // profiles.email is synced on every login (app/auth/callback) and
  // backfilled for existing accounts by migration 027.
  const { data: existingProfile, error: existingProfileErr } = await admin.from('profiles')
    .select('plan_id, trial_ends_at').ilike('email', email).maybeSingle()
  if (existingProfileErr) {
    return NextResponse.json({ error: 'Could not check that email — please try again.' }, { status: 500 })
  }
  if (existingProfile && effectivePlanId(existingProfile.plan_id, existingProfile.trial_ends_at) !== null) {
    return NextResponse.json({
      error: 'This email already has its own AlertGA4 account with an active plan — it can\'t also join your team. They would need to accept from a different Google account.',
    }, { status: 409 })
  }

  const { data: invite, error: insertErr } = await admin.from('team_members')
    .insert({ owner_id: user.id, email })
    .select('id, invite_token').single()
  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'That email is already invited or on your team.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not create the invite — please try again.' }, { status: 500 })
  }

  if (groupId) {
    const { error: grantErr } = await admin
      .from('group_team_members')
      .insert({ group_id: groupId, team_member_id: invite.id })
    // Non-fatal: the invite itself succeeded and is visible/fixable from
    // the Team page either way — worth logging, not worth failing the
    // whole invite over a second insert.
    if (grantErr) console.error('[team] Could not grant invited member the originating group:', grantErr.message)
  }

  const sent = await sendEmail({ to: email, ...renderTeamInviteEmail(user.email, invite.invite_token) })
  if (!sent) {
    // The invite row exists either way (so it's visible/resendable from the
    // team page) — only the email delivery failed, which is worth surfacing
    // since the invitee has no other way to find out.
    return NextResponse.json({ ok: true, warning: 'Invite created, but the email could not be sent — share the link from the team page instead.' })
  }

  return NextResponse.json({ ok: true })
}
