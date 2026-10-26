import { createAdminClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/billing/plans'

export interface AdminStats {
  workerRunsCompleted30d: number
  workerRunsFailed30d: number
  disconnectedOwners: number
  avgScore: number | null
  medianScore: number | null
  autoRunEnabled: number
  autoRunDisabled: number
  customEventsAdoption: number
  ecommerceAdoption: number
  parametersAdoption: number
  totalActiveProjects: number
  usersWithProject: number
  alertsSent30d: number
  mrrPLN: number
  cancelingAtPeriodEnd: number
  deletedAccountsTotal: number
  deletedAccounts30d: number
  deletedPayingAccountsTotal: number
}

function dayKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function fetchAdminStats(admin: ReturnType<typeof createAdminClient>): Promise<AdminStats> {
  const thirtyDaysAgo = dayKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const [
    { data: recentRuns },
    { data: allProjects },
    { data: customEventRows },
    { data: ecomRows },
    { data: paramRows },
    { data: alertsRaw },
    { data: billingRowsRaw },
    { data: deletionsRaw },
  ] = await Promise.all([
    admin.from('dqs_runs').select('status').gte('run_date', thirtyDaysAgo),
    admin.from('projects').select('id, owner_id, status, auto_run'),
    admin.from('custom_event_checks').select('project_id'),
    admin.from('ecommerce_config').select('project_id'),
    admin.from('parameter_checks').select('project_id'),
    admin.from('alert_log').select('id').gte('sent_at', thirtyDaysAgo),
    admin.from('profiles').select('plan_id, billing_cycle, cancel_at_period_end'),
    admin.from('account_deletions').select('deleted_at, was_paying'),
  ])

  const runs = (recentRuns ?? []) as { status: string }[]
  const workerRunsCompleted30d = runs.filter(r => r.status === 'completed').length
  const workerRunsFailed30d = runs.filter(r => r.status === 'failed').length

  const projects = (allProjects ?? []) as { id: string; owner_id: string | null; status: string; auto_run: boolean | null }[]
  const ownerIds = [...new Set(projects.map(p => p.owner_id).filter((id): id is string => !!id))]

  let disconnectedOwners = 0
  if (ownerIds.length > 0) {
    const { data: disconnectedProfiles } = await admin
      .from('profiles').select('id').in('id', ownerIds).is('ga4_refresh_token', null)
    disconnectedOwners = disconnectedProfiles?.length ?? 0
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const activeIds = activeProjects.map(p => p.id)

  let avgScore: number | null = null
  let medianScore: number | null = null

  if (activeIds.length > 0) {
    const { data: runsForActive } = await admin
      .from('dqs_runs')
      .select('project_id, score_total, run_date')
      .eq('status', 'completed')
      .in('project_id', activeIds)
      .order('run_date', { ascending: false })

    // Rows arrive newest-first — first occurrence per project is its latest score.
    const latestByProject = new Map<string, number>()
    for (const r of runsForActive ?? []) {
      if (r.score_total == null || latestByProject.has(r.project_id)) continue
      latestByProject.set(r.project_id, r.score_total)
    }

    const scores = [...latestByProject.values()]
    if (scores.length > 0) {
      avgScore = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      const sorted = [...scores].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      medianScore = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1)
    }
  }

  const autoRunEnabled = activeProjects.filter(p => p.auto_run === true).length
  const autoRunDisabled = activeProjects.length - autoRunEnabled

  const customEventsAdoption = new Set((customEventRows ?? []).map((r: any) => r.project_id)).size
  const ecommerceAdoption = new Set((ecomRows ?? []).map((r: any) => r.project_id)).size
  const parametersAdoption = new Set((paramRows ?? []).map((r: any) => r.project_id)).size

  // Estimate only — mirrors whatever's actually in plans.ts, so it drifts
  // automatically if prices change, but ignores coupons/discounts applied
  // in Stripe directly (those aren't reflected in profiles at all).
  const billingRows = (billingRowsRaw ?? []) as { plan_id: string | null; billing_cycle: string | null; cancel_at_period_end: boolean | null }[]
  let mrrPLN = 0
  let cancelingAtPeriodEnd = 0
  for (const b of billingRows) {
    const plan = PLANS.find(p => p.id === b.plan_id)
    if (plan) mrrPLN += b.billing_cycle === 'yearly' ? plan.priceYearlyPLN / 12 : plan.priceMonthlyPLN
    if (b.cancel_at_period_end) cancelingAtPeriodEnd++
  }
  mrrPLN = Math.round(mrrPLN)

  // Tracking only starts once migration 042 + this app code shipped —
  // deletion was a true hard-delete with no trace before that, so these
  // counts are never retroactive.
  const deletions = (deletionsRaw ?? []) as { deleted_at: string; was_paying: boolean | null }[]
  const deletedAccountsTotal = deletions.length
  const deletedAccounts30d = deletions.filter(d => d.deleted_at >= thirtyDaysAgo).length
  const deletedPayingAccountsTotal = deletions.filter(d => d.was_paying).length

  return {
    workerRunsCompleted30d,
    workerRunsFailed30d,
    disconnectedOwners,
    avgScore,
    medianScore,
    autoRunEnabled,
    autoRunDisabled,
    customEventsAdoption,
    ecommerceAdoption,
    parametersAdoption,
    totalActiveProjects: activeProjects.length,
    usersWithProject: ownerIds.length,
    alertsSent30d: alertsRaw?.length ?? 0,
    mrrPLN,
    cancelingAtPeriodEnd,
    deletedAccountsTotal,
    deletedAccounts30d,
    deletedPayingAccountsTotal,
  }
}
