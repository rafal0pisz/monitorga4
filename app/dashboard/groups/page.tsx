import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, canUseTeamFeature } from '@/lib/billing/plans'
import GroupManager, { type GroupRow, type GroupProjectOption, type GroupMemberOption } from '@/components/team/GroupManager'
import Link from 'next/link'

export default async function GroupsPage() {
  const user = await getAuthUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  if (bypass || !user) {
    return (
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Groups</h1>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
  const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
  const canUse = canUseTeamFeature(effective)

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Groups</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          Group a client&apos;s services together and grant access once — anyone added to the group sees every service in it, including ones added later. See also <Link href="/dashboard/team" style={{ color: '#16a34a' }}>Team</Link> for people who should only see one specific, ungrouped service.
        </p>
      </div>

      {!canUse ? (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>Groups are available on the Pro and Agency plans.</p>
          <Link href="/cennik" style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
            View pricing →
          </Link>
        </div>
      ) : (
        <GroupsOwnerView ownerId={user.id} />
      )}
    </div>
  )
}

async function GroupsOwnerView({ ownerId }: { ownerId: string }) {
  const admin = createAdminClient()
  const [{ data: groupRows }, { data: projectRows }, { data: memberRows }] = await Promise.all([
    admin.from('project_groups').select('id, name').eq('owner_id', ownerId).order('name'),
    admin.from('projects').select('id, name, group_id').eq('owner_id', ownerId).order('name'),
    admin.from('team_members').select('id, email, accepted_at').eq('owner_id', ownerId).order('invited_at'),
  ])

  const groupIds = (groupRows ?? []).map((g: any) => g.id as string)
  const { data: groupGrants } = groupIds.length > 0
    ? await admin.from('group_team_members').select('group_id, team_member_id').in('group_id', groupIds)
    : { data: [] as { group_id: string; team_member_id: string }[] }

  const projectIdsByGroup = new Map<string, string[]>()
  for (const p of projectRows ?? []) {
    if (!p.group_id) continue
    if (!projectIdsByGroup.has(p.group_id)) projectIdsByGroup.set(p.group_id, [])
    projectIdsByGroup.get(p.group_id)!.push(p.id)
  }
  const memberIdsByGroup = new Map<string, string[]>()
  for (const g of groupGrants ?? []) {
    if (!memberIdsByGroup.has(g.group_id)) memberIdsByGroup.set(g.group_id, [])
    memberIdsByGroup.get(g.group_id)!.push(g.team_member_id)
  }

  const groups: GroupRow[] = (groupRows ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    projectIds: projectIdsByGroup.get(g.id) ?? [],
    memberIds: memberIdsByGroup.get(g.id) ?? [],
  }))

  const allProjects: GroupProjectOption[] = (projectRows ?? []).map((p: any) => ({ id: p.id, name: p.name, groupId: p.group_id }))
  const allMembers: GroupMemberOption[] = (memberRows ?? []).map((m: any) => ({ id: m.id, email: m.email, accepted: !!m.accepted_at }))

  return <GroupManager groups={groups} allProjects={allProjects} allMembers={allMembers} />
}
