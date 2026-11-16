import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, canUseTeamFeature, maxMembersPerProject } from '@/lib/billing/plans'
import { getTeamContext, MAX_TEAM_SEATS } from '@/lib/team/access'
import TeamManager, { type TeamMemberRow } from '@/components/team/TeamManager'
import Link from 'next/link'
import LeaveTeamButton from '@/components/team/LeaveTeamButton'
import { APP_URL } from '@/lib/email/shared'

export default async function TeamPage() {
  const user = await getAuthUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  if (bypass || !user) {
    return (
      <div style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Team</h1>
      </div>
    )
  }

  const admin = createAdminClient()
  const [{ data: profile }, teamContext] = await Promise.all([
    admin.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single(),
    getTeamContext(user.id),
  ])
  const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
  const isOwner = canUseTeamFeature(effective)
  const perProjectCap = maxMembersPerProject(effective)

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Team</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          Invite people to your account, then choose exactly which <Link href="/dashboard/groups" style={{ color: '#16a34a' }}>groups</Link> each one can see — nobody on your team sees a service unless it&apos;s in a group they&apos;ve been added to.
        </p>
      </div>

      {/* Your own team — independent of any team you're also a member of. */}
      {isOwner && (
        <div style={{ marginBottom: teamContext.isMember ? 32 : 0 }}>
          <TeamOwnerView ownerId={user.id} perProjectCap={perProjectCap} />
        </div>
      )}

      {/* A team you're a member of — independent of whether you also own
          your own Agency team above. */}
      {teamContext.isMember && teamContext.teamOwnerId && (
        <MemberView ownerId={teamContext.teamOwnerId} />
      )}

      {!isOwner && !teamContext.isMember && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            Team members are available on the Pro plan (up to 3 people per service) and the Agency plan (up to {MAX_TEAM_SEATS - 1} people account-wide).
          </p>
          <Link href="/cennik" style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
            View pricing →
          </Link>
        </div>
      )}
    </div>
  )
}

async function TeamOwnerView({ ownerId, perProjectCap }: { ownerId: string; perProjectCap: number }) {
  const admin = createAdminClient()
  const [{ data: members }, { data: groups }] = await Promise.all([
    admin.from('team_members').select('id, email, accepted_at, invited_at, invite_token').eq('owner_id', ownerId).order('invited_at'),
    admin.from('project_groups').select('id, name').eq('owner_id', ownerId).order('name'),
  ])

  const memberIds = (members ?? []).map((m: any) => m.id as string)
  const { data: grants } = memberIds.length > 0
    ? await admin.from('group_team_members').select('group_id, team_member_id').in('team_member_id', memberIds)
    : { data: [] as { group_id: string; team_member_id: string }[] }

  const grantsByMember = new Map<string, string[]>()
  for (const g of grants ?? []) {
    if (!grantsByMember.has(g.team_member_id)) grantsByMember.set(g.team_member_id, [])
    grantsByMember.get(g.team_member_id)!.push(g.group_id)
  }

  const memberRows: TeamMemberRow[] = (members ?? []).map((m: any) => ({
    ...(m as any),
    groupIds: grantsByMember.get(m.id) ?? [],
  }))

  return (
    <TeamManager
      members={memberRows}
      allGroups={(groups ?? []) as { id: string; name: string }[]}
      maxSeats={MAX_TEAM_SEATS}
      perProjectCap={perProjectCap}
      appUrl={APP_URL}
    />
  )
}

async function MemberView({ ownerId }: { ownerId: string }) {
  const admin = createAdminClient()
  const { data: ownerUser } = await admin.auth.admin.getUserById(ownerId)

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>Team membership</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
        You&apos;re part of <b style={{ color: 'var(--color-text-primary)' }}>{ownerUser?.user?.email ?? 'an AlertGA4'}</b>&apos;s team. You&apos;ll only see the services in the groups they&apos;ve added you to (and, for each one, once they&apos;ve also granted your Google account its own GA4 access) — not every project on their account.
      </p>
      <LeaveTeamButton />
    </div>
  )
}
