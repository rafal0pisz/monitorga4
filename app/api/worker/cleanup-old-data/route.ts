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
// (dqs_runs/dqs_results) older than RETENTION_DAYS so the DB doesn't grow
// unbounded — this table gets a row per check per project per day, forever,
// with no cap until this ran. 40 days is comfortably more than anything
// currently reads: the history page shows the last 30 completed runs
// (app/project/[id]/history/page.tsx's HISTORY_RUNS) and the worker's own
// trend/baseline comparisons look back at most a few weeks. Only touches
// this check-history data — profiles, projects, billing_events and
// everything else are untouched; those aren't the source of unbounded
// growth and billing history should never be auto-deleted.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10)

  try {
    const { data: oldRuns, error: selectError } = await admin
      .from('dqs_runs')
      .select('id')
      .lt('run_date', cutoff)
    if (selectError) throw selectError

    const oldRunIds = (oldRuns ?? []).map((r: { id: string }) => r.id)
    if (oldRunIds.length === 0) {
      return NextResponse.json({ ok: true, cutoff, runs_deleted: 0, results_deleted: 0 })
    }

    // dqs_results first (references dqs_runs.id) — deleting in this order
    // works regardless of whether a cascade FK exists on the live schema.
    const { error: resultsError, count: resultsDeleted } = await admin
      .from('dqs_results')
      .delete({ count: 'exact' })
      .in('run_id', oldRunIds)
    if (resultsError) throw resultsError

    const { error: runsError, count: runsDeleted } = await admin
      .from('dqs_runs')
      .delete({ count: 'exact' })
      .lt('run_date', cutoff)
    if (runsError) throw runsError

    return NextResponse.json({ ok: true, cutoff, runs_deleted: runsDeleted ?? oldRunIds.length, results_deleted: resultsDeleted ?? null })
  } catch (err) {
    console.error('[worker/cleanup-old-data] Failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
