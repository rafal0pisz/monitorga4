import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId } from '@/lib/billing/plans'
import { getTeamContext, MAX_TEAM_SEATS } from '@/lib/team/access'
import TeamManager, { type TeamMemberRow } from '@/components/team/TeamManager'
import LeaveTeamButton from '@/components/team/LeaveTeamButton'
import { APP_URL } from '@/lib/email/shared'
import Link from 'next/link'

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
  const isOwner = effective === 'agency' || effective === 'trial'

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Team</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Share access to your monitored GA4 properties with your team.</p>
      </div>

      {/* Your own team — independent of any team you're also a member of. */}
      {isOwner && (
        <div style={{ marginBottom: teamContext.isMember ? 32 : 0 }}>
          <TeamOwnerView ownerId={user.id} />
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
            Team members are available on the Agency plan — invite up to {MAX_TEAM_SEATS - 1} people to share access to your monitored GA4 properties.
          </p>
          <Link href="/cennik" style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
            View pricing →
          </Link>
        </div>
      )}
    </div>
  )
}

async function TeamOwnerView({ ownerId }: { ownerId: string }) {
  const admin = createAdminClient()
  const { data } = await admin.from('team_members')
    .select('id, email, accepted_at, invited_at, invite_token')
    .eq('owner_id', ownerId).order('invited_at')

  return <TeamManager members={(data ?? []) as TeamMemberRow[]} maxSeats={MAX_TEAM_SEATS} appUrl={APP_URL} />
}

async function MemberView({ ownerId }: { ownerId: string }) {
  const admin = createAdminClient()
  const { data: ownerUser } = await admin.auth.admin.getUserById(ownerId)

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>Team membership</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
        You&apos;re part of <b style={{ color: 'var(--color-text-primary)' }}>{ownerUser?.user?.email ?? 'an AlertGA4'}</b>&apos;s team — you can see and manage their monitored projects (once they&apos;ve granted your Google account access to each one in GA4), shown separately from any projects of your own on your dashboard.
      </p>
      <LeaveTeamButton />
    </div>
  )
}
