import NewProjectForm from '@/components/project/NewProjectForm'
import NewProjectTargetPicker from '@/components/project/NewProjectTargetPicker'
import StartTrialButton from '@/components/billing/StartTrialButton'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, planLimit, alertEmailLimit, TRIAL_DAYS } from '@/lib/billing/plans'
import { getTeamContext } from '@/lib/team/access'
import Link from 'next/link'

export default async function NewProjectPage() {
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  // "Own" (your own plan) and "Team" (an Agency account you're a member
  // of) are two independent places a new project can go — see
  // src/lib/team/access.ts. Both are checked up front, before the wizard
  // renders, so a dead-end ("PLAN_LIMIT_REACHED" from create_project at
  // the very last step) never happens after someone's already filled in
  // custom events/ecommerce/parameters.
  let ownCanCreate = false
  let ownCanStartTrial = false
  let ownTrialExpired = false
  let ownLimit = 0
  let ownMaxAlertEmails = 2
  let teamCanCreate = false
  let teamOwnerId: string | null = null
  let teamOwnerEmail: string | null = null
  let teamMaxAlertEmails = 2

  if (!bypass) {
    const user = await getAuthUser()
    if (user) {
      const teamContext = await getTeamContext(user.id)
      const admin = createAdminClient()

      const ownQueries = Promise.all([
        admin.from('profiles').select('plan_id, trial_ends_at, trial_used_at').eq('id', user.id).single(),
        admin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      ])
      const teamQueries = teamContext.isMember && teamContext.teamOwnerId
        ? Promise.all([
            admin.from('profiles').select('plan_id, trial_ends_at').eq('id', teamContext.teamOwnerId).single(),
            admin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', teamContext.teamOwnerId),
            admin.auth.admin.getUserById(teamContext.teamOwnerId),
          ])
        : null

      const [[{ data: ownProfile }, { count: ownCount }], teamResults] = await Promise.all([ownQueries, teamQueries ?? Promise.resolve(null)])

      const ownEffective = effectivePlanId(ownProfile?.plan_id, ownProfile?.trial_ends_at)
      ownLimit = planLimit(ownEffective)
      ownMaxAlertEmails = alertEmailLimit(ownEffective)
      ownCanCreate = ownEffective !== null && (ownCount ?? 0) < ownLimit
      ownCanStartTrial = ownEffective === null && !ownProfile?.trial_used_at
      ownTrialExpired = ownProfile?.plan_id === 'trial' && ownEffective === null

      if (teamResults) {
        const [{ data: teamProfile }, { count: teamCount }, { data: ownerUserRes }] = teamResults
        const teamEffective = effectivePlanId(teamProfile?.plan_id, teamProfile?.trial_ends_at)
        const teamLimit = planLimit(teamEffective)
        teamMaxAlertEmails = alertEmailLimit(teamEffective)
        teamCanCreate = (teamCount ?? 0) < teamLimit
        teamOwnerId = teamContext.teamOwnerId
        teamOwnerEmail = ownerUserRes?.user?.email ?? null
      }
    }
  }

  const canCreateAnywhere = ownCanCreate || teamCanCreate

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', gap: 6 }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>New project</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>New project</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 28px' }}>Connect a GA4 property to the quality monitor</p>

      {canCreateAnywhere ? (
        ownCanCreate && teamCanCreate && teamOwnerId ? (
          <NewProjectTargetPicker ownTarget={{ label: 'My account' }} teamTarget={{ ownerId: teamOwnerId, label: teamOwnerEmail ? `${teamOwnerEmail}'s team` : 'Team' }} />
        ) : teamCanCreate && teamOwnerId ? (
          <>
            <div style={{ fontSize: 12.5, color: '#92400e', background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              This project will be added to your team&apos;s account. Daily automated checks run on {teamOwnerEmail ? <b>{teamOwnerEmail}</b> : 'the owner'}&apos;s Google access — if only your Google account has Viewer access to this GA4 property, make sure {teamOwnerEmail ?? 'they'} get{teamOwnerEmail ? 's' : ''} it too, or checks will fail.
            </div>
            <NewProjectForm ownerId={teamOwnerId} maxAlertEmails={teamMaxAlertEmails} />
          </>
        ) : (
          <NewProjectForm maxAlertEmails={ownMaxAlertEmails} />
        )
      ) : ownCanStartTrial ? (
        <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, color: '#166534', margin: '0 0 10px' }}>
            You don&apos;t have a paid plan yet, so you can&apos;t create a project{teamOwnerId ? ' of your own' : ''}. Start your free {TRIAL_DAYS}-day trial on Pro terms (up to 15 GA4 properties) — no card required, one-time only.
          </p>
          <StartTrialButton label={`Start ${TRIAL_DAYS}-day free trial`} lang="en" />
          {teamOwnerId && (
            <p style={{ fontSize: 12, color: '#166534', margin: '10px 0 0' }}>
              {teamOwnerEmail ?? 'Your team'}&apos;s own plan has also reached its project limit — ask them to upgrade to add more.
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 12.5, color: '#9a3412', margin: 0 }}>
            {ownTrialExpired
              ? 'Your free trial has ended. Upgrade to a paid plan to keep using AlertGA4.'
              : teamOwnerId
              ? `Your plan's project limit (${ownLimit}) and ${teamOwnerEmail ?? 'your team'}'s are both reached. Upgrade either to add more.`
              : `You've reached your plan's project limit (${ownLimit}). Upgrade to add more.`}
          </p>
          <Link href="/cennik" style={{ fontSize: 12.5, color: '#9a3412', fontWeight: 500, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</Link>
        </div>
      )}
    </div>
  )
}
