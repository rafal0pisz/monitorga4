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

// Project-level sharing, layered on top of account-wide team membership
// above. An accepted team_members row alone no longer implies visibility
// into every one of the owner's projects — it only grants a seat and an
// identity. WHICH of the owner's projects a member can actually see is
// tracked two ways: a direct grant on one project (project_team_members,
// migration 043), or a grant on a GROUP of projects (group_team_members,
// migration 044) — a project belongs to at most one group
// (projects.group_id), and granting a group covers every project in it,
// including ones added to the group later. Both are additive. Granted
// from either that project's/group's own management UI or the Team page.
// getAccessibleOwnerIds/getTeamContext above are still exactly right for
// account-wide capabilities that aren't about specific projects (seat
// counting, "can this person create a new project under the owner's
// account" — see app/dashboard/new/page.tsx) — only project VISIBILITY and
// per-project AUTHORIZATION route through these instead now.

// Every project id a user may see via a team they're an accepted member of
// (their own projects aren't included — callers that need "all accessible
// project ids" combine this with their own project query directly, since
// that's usually a different underlying table/view).
export async function getGrantedProjectIds(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data: membership, error: memberErr } = await admin
    .from('team_members')
    .select('id')
    .eq('member_id', userId)
    .not('accepted_at', 'is', null)

  // Fail CLOSED, same reasoning as getTeamContext above — a transient
  // lookup error must only ever narrow access for this one request, never
  // widen it into "every project this membership could ever reach".
  if (memberErr) {
    console.error('[team] Membership lookup failed — denying shared project access:', memberErr.message)
    return []
  }
  if (!membership || membership.length === 0) return []
  const teamMemberIds = membership.map((m: { id: string }) => m.id)

  const [{ data: directGrants, error: directErr }, { data: groupGrants, error: groupErr }] = await Promise.all([
    admin.from('project_team_members').select('project_id').in('team_member_id', teamMemberIds),
    admin.from('group_team_members').select('group_id').in('team_member_id', teamMemberIds),
  ])
  if (directErr || groupErr) {
    console.error('[team] Project/group grant lookup failed — denying shared project access:', (directErr ?? groupErr)!.message)
    return []
  }

  const projectIds = new Set<string>((directGrants ?? []).map((g: { project_id: string }) => g.project_id))

  const groupIds = (groupGrants ?? []).map((g: { group_id: string }) => g.group_id)
  if (groupIds.length > 0) {
    const { data: groupedProjects, error: groupedProjectsErr } = await admin
      .from('projects').select('id').in('group_id', groupIds)
    if (groupedProjectsErr) {
      console.error('[team] Grouped-project lookup failed — denying group-based access:', groupedProjectsErr.message)
    } else {
      for (const p of groupedProjects ?? []) projectIds.add((p as { id: string }).id)
    }
  }

  return [...projectIds]
}

// Whether userId may access one SPECIFIC, already-known project — the
// project's own owner always can; an accepted team member can only if that
// exact project has been explicitly granted to them. Drop-in replacement
// for the old `(await getAccessibleOwnerIds(userId)).includes(project.owner_id)`
// idiom used throughout the app wherever a project row is already in hand.
export async function canAccessProject(userId: string, project: { id: string; owner_id: string }): Promise<boolean> {
  if (project.owner_id === userId) return true
  return (await getGrantedProjectIds(userId)).includes(project.id)
}
