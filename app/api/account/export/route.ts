import { NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Self-service data export (GDPR art. 20) — previously the only way to get
// your own data out of AlertGA4 was to email kontakt@bettersteps.pl and wait
// for someone to pull it manually. Deliberately leaves out anything that
// isn't "your data" in the GDPR sense but IS a live credential: GA4 OAuth
// tokens (ga4_access_token/refresh_token) and ga4_credentials (service
// account keys some projects store) — downloading those into a file would
// just create a new way to leak access to the client's own GA4 property.
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: profile }, { data: projects }] = await Promise.all([
    admin.from('profiles')
      .select('plan_id, trial_ends_at, subscription_status, billing_cycle, current_period_end, onboarding_dismissed_at')
      .eq('id', user.id).single(),
    admin.from('projects')
      .select('id, name, ga4_property_id, own_domain, expected_events, alert_threshold, alert_only_on_issues, alert_email, critical_alert_email, critical_alert_checks, status, auto_run, sections, created_at')
      .eq('owner_id', user.id).order('created_at'),
  ])

  const projectIds = (projects ?? []).map((p: { id: string }) => p.id)

  const [{ data: runs }, { data: alerts }] = await Promise.all([
    projectIds.length
      ? admin.from('dqs_runs').select('project_id, run_date, status, score_total, error_message').in('project_id', projectIds).order('run_date')
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? admin.from('alert_log').select('project_id, sent_at, score').in('project_id', projectIds).order('sent_at')
      : Promise.resolve({ data: [] }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, user_id: user.id, created_at: user.created_at },
    profile: profile ?? null,
    projects: projects ?? [],
    daily_check_runs: runs ?? [],
    alert_history: alerts ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="alertga4-data-export.json"',
    },
  })
}
