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
  // The Agency owner's id, if this user is an accepted member of their
  // team — entirely independent of whether this user ALSO owns their own
  // plan/projects. Own-account billing, plan and project creation never
  // route through this; it only ever matters for the team's SHARED
  // projects (owner_id = teamOwnerId), never this person's own.
  // v1 constraint: a person belongs to at most one team at a time.
  teamOwnerId: string | null
  isMember: boolean // = teamOwnerId !== null
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
    return { accessibleOwnerIds: [userId], teamOwnerId: null, isMember: false }
  }

  const ownerIds = (data ?? []).map((r: { owner_id: string }) => r.owner_id)
  if (ownerIds.length === 0) {
    return { accessibleOwnerIds: [userId], teamOwnerId: null, isMember: false }
  }
  // v1: ignore any membership beyond the first rather than error — this can
  // only happen if someone was added to a second team by hand/by a future
  // bug, and silently taking the first is safer than breaking their access
  // entirely.
  return { accessibleOwnerIds: [userId, ...ownerIds], teamOwnerId: ownerIds[0], isMember: true }
}

export async function getAccessibleOwnerIds(userId: string): Promise<string[]> {
  return (await getTeamContext(userId)).accessibleOwnerIds
}
