import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Same dual-authorization pattern as the other /api/worker/* routes — must
// be callable by Vercel Cron (no session, CRON_SECRET bearer token) and
// also manually by a signed-in user for testing.
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && safeCompare(authHeader, `Bearer ${cronSecret}`)) return true
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

const RETENTION_DAYS = 40

// GET — Vercel Cron, once daily. Prunes daily check history
// (dqs_runs/dqs_results) and the two alert-send logs (alert_log/
// critical_alert_log) older than RETENTION_DAYS so the DB doesn't grow
// unbounded — these get a row per check/alert per project per day, forever,
// with no cap until this ran. 40 days is comfortably more than anything
// currently reads: the history page shows the last 30 completed runs
// (app/project/[id]/history/page.tsx's HISTORY_RUNS), the worker's own
// trend/baseline comparisons look back at most a few weeks, and the alert
// logs are only ever read one row at a time ("when did we last alert this
// project") via an ORDER BY ... LIMIT 1, never a historical list. Only
// touches these four tables — profiles, projects, billing_events and
// everything else are untouched; those aren't the source of unbounded
// growth and billing history should never be auto-deleted.
//
// alert_log/critical_alert_log are pruned by their own sent_at, independent
// of the dqs_runs deletion above — critical_alert_log.run_id is ON DELETE
// SET NULL (migration 019), so deleting old dqs_runs rows never removes the
// alert log rows that reference them.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10)
  const cutoffTimestamp = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString()

  try {
    const { data: oldRuns, error: selectError } = await admin
      .from('dqs_runs')
      .select('id')
      .lt('run_date', cutoffDate)
    if (selectError) throw selectError

    const oldRunIds = (oldRuns ?? []).map((r: { id: string }) => r.id)

    let resultsDeleted: number | null = 0
    let runsDeleted: number | null = 0
    if (oldRunIds.length > 0) {
      // dqs_results first (references dqs_runs.id) — deleting in this order
      // works regardless of whether a cascade FK exists on the live schema.
      const { error: resultsError, count } = await admin
        .from('dqs_results')
        .delete({ count: 'exact' })
        .in('run_id', oldRunIds)
      if (resultsError) throw resultsError
      resultsDeleted = count

      const { error: runsError, count: runsCount } = await admin
        .from('dqs_runs')
        .delete({ count: 'exact' })
        .lt('run_date', cutoffDate)
      if (runsError) throw runsError
      runsDeleted = runsCount ?? oldRunIds.length
    }

    const { error: alertLogError, count: alertLogDeleted } = await admin
      .from('alert_log')
      .delete({ count: 'exact' })
      .lt('sent_at', cutoffTimestamp)
    if (alertLogError) throw alertLogError

    const { error: criticalAlertLogError, count: criticalAlertLogDeleted } = await admin
      .from('critical_alert_log')
      .delete({ count: 'exact' })
      .lt('sent_at', cutoffTimestamp)
    if (criticalAlertLogError) throw criticalAlertLogError

    return NextResponse.json({
      ok: true,
      cutoff: cutoffDate,
      runs_deleted: runsDeleted,
      results_deleted: resultsDeleted,
      alert_log_deleted: alertLogDeleted,
      critical_alert_log_deleted: criticalAlertLogDeleted,
    })
  } catch (err) {
    console.error('[worker/cleanup-old-data] Failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
