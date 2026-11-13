import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ownerHasActiveAccess, trialExpiredPayload } from '@/lib/billing/access'
import { getAccessibleOwnerIds } from '@/lib/team/access'
import { memberHasAccessToProperty, NO_GA4_ACCESS_MESSAGE } from '@/lib/ga4/memberAccess'

// Read-only view over the worker's own daily parameter-coverage results
// (dqs_runs/dqs_results, written by checkParameters() in
// app/api/worker/run/route.ts) — no GA4 calls at all. Used instead of
// /api/ga4/parameters for projects with enough declared parameter checks
// that firing one live request per parameter risks GA4's per-property
// concurrent-requests quota (see src/lib/ga4/report.ts). The worker
// already computes this for every project daily regardless of size, so
// this endpoint is just a different read path, not new computation.
//
// check_key is `param_${event_name}_${parameter_name}` — both names can
// themselves contain underscores, so splitting that string back apart
// would be ambiguous. Instead this recomputes the same key per declared
// check (from get_parameter_checks, the source of truth for what's
// configured right now) and looks it up in a map, which is exact
// regardless of underscores in either name.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('ga4_property_id, owner_id')
    .eq('id', projectId)
    .single()

  if (!project || !(await getAccessibleOwnerIds(user.id)).includes(project.owner_id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!(await ownerHasActiveAccess(project.owner_id))) {
    return NextResponse.json(trialExpiredPayload(user.id, project.owner_id), { status: 402 })
  }

  if (project.owner_id !== user.id && !(await memberHasAccessToProperty(user.id, project.ga4_property_id))) {
    return NextResponse.json({ error: NO_GA4_ACCESS_MESSAGE }, { status: 403 })
  }

  const { data: paramRaw } = await admin.rpc('get_parameter_checks', { p_project_id: projectId })
  const parameterChecks: { event_name: string; parameter_name: string }[] =
    (Array.isArray(paramRaw) ? paramRaw : []).map((p: any) => ({ event_name: p.event_name, parameter_name: p.parameter_name }))

  const { data: latestRun } = await admin
    .from('dqs_runs')
    .select('id, run_date, status')
    .eq('project_id', projectId)
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestRun) {
    return NextResponse.json({ pending: true })
  }

  const { data: resultsRaw } = await admin
    .from('dqs_results')
    .select('check_key, status, value')
    .eq('run_id', latestRun.id)

  const byKey = new Map<string, { status: string; value: any }>()
  for (const r of resultsRaw ?? []) byKey.set(r.check_key, { status: r.status, value: r.value })

  const results = parameterChecks.map(pc => {
    const key = `param_${pc.event_name}_${pc.parameter_name}`
    const row = byKey.get(key)
    if (!row || row.value?.error) {
      return { event_name: pc.event_name, parameter_name: pc.parameter_name, error: row?.value?.error ?? 'Not computed yet — included starting with the next scheduled run.' }
    }
    return {
      event_name: pc.event_name,
      parameter_name: pc.parameter_name,
      coverage_current: row.value.coverage_current as number,
      coverage_prev: row.value.coverage_prev as number,
      delta: row.value.delta as number,
      status: row.status,
    }
  })

  return NextResponse.json({
    pending: false,
    runDate: latestRun.run_date,
    runStatus: latestRun.status,
    results,
  })
}
