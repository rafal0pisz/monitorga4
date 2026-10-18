import { createAdminClient } from '@/lib/supabase/server'

// Agency plan seat count — chosen as a sane default while we validate demand;
// easy to bump later without touching the invite flow itself. Counts total
// people with access (the owner + invited members), not just invites.
export const MAX_TEAM_SEATS = 5

export interface TeamContext {
  // Every owner_id this user may act as: themselves, plus any owner whose
  // team they've been added to and have accepted. Use this for anything
  // that lists/reads/writes projects.
  accessibleOwnerIds: string[]
  // Whose plan/billing/limits apply to this session — the user's own id,
  // unless they're a pure invited member, in which case it's the team
  // owner's id. v1 constraint: a person belongs to at most one team, so
  // there's never more than one "other" owner to resolve to.
  primaryOwnerId: string
  // True when this user has no plan of their own and is acting purely as
  // an invited member of someone else's Agency team.
  isMember: boolean
}

// Fails CLOSED on a lookup error — i.e. resolves to just the user's own id,
// never silently includes someone else's owner_id. The failure mode here
// must never be "show this person another account's data"; at worst a team
// member temporarily loses access to shared projects during a transient DB
// error, which is recoverable and nowhere near as bad as a cross-account
// data leak.
export async function getTeamContext(userId: string): Promise<TeamContext> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_id', userId)
    .not('accepted_at', 'is', null)

  if (error) {
    console.error('[team] Membership lookup failed — falling back to own account only:', error.message)
    return { accessibleOwnerIds: [userId], primaryOwnerId: userId, isMember: false }
  }

  const ownerIds = (data ?? []).map((r: { owner_id: string }) => r.owner_id)
  if (ownerIds.length === 0) {
    return { accessibleOwnerIds: [userId], primaryOwnerId: userId, isMember: false }
  }
  // v1: ignore any membership beyond the first rather than error — this can
  // only happen if someone was added to a second team by hand/by a future
  // bug, and silently taking the first is safer than breaking their access
  // entirely.
  return { accessibleOwnerIds: [userId, ...ownerIds], primaryOwnerId: ownerIds[0], isMember: true }
}

export async function getAccessibleOwnerIds(userId: string): Promise<string[]> {
  return (await getTeamContext(userId)).accessibleOwnerIds
}
