import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, randomBytes } from 'crypto'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { renderTrialWinbackEmail, type WinbackLastRun } from '@/lib/email/trialWinback'
import { ensureStripeCustomer, createWinbackPromoCode } from '@/lib/billing/winback'

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Same dual-authorization pattern as /api/worker/trial-reminders — must be
// callable by Vercel Cron (no session, CRON_SECRET bearer token instead).
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

const DAY_MS = 86400000
const WINBACK_DELAY_DAYS = 2

// PAUSED as of 2026-10-23 — the cron entry for this route was removed from
// vercel.json. Privacy policy currently states data isn't used for
// marketing purposes, which this email (a promotional discount code)
// contradicts; paused until that's resolved (policy update, or scoping this
// as a disclosed transactional/lifecycle email) rather than shipped with a
// known compliance gap. Route and logic left intact — re-add the cron entry
// to resume once decided.
//
// GET — Vercel Cron, once daily. Finds trials whose trial_ends_at fell
// 2-3 days ago (a 1-day window so a daily cron catches each account
// exactly once) and that haven't had a win-back email yet, emails a recap
// of their last check plus a one-time 30%-off code, and marks them sent.
// The date window itself is what keeps this from ever backfilling trials
// that expired long before this shipped — nothing with an old
// trial_ends_at can ever fall inside "2-3 days ago" relative to today.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - (WINBACK_DELAY_DAYS + 1) * DAY_MS).toISOString()
  const windowEnd = new Date(now.getTime() - WINBACK_DELAY_DAYS * DAY_MS).toISOString()

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, trial_ends_at')
    .eq('plan_id', 'trial')
    .is('trial_winback_sent_at', null)
    .gte('trial_ends_at', windowStart)
    .lte('trial_ends_at', windowEnd)

  let sent = 0
  for (const profile of candidates ?? []) {
    if (!profile.trial_ends_at) continue
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    // Recap: the most recent completed check across any of this account's
    // projects — omitted from the email entirely if they churned before a
    // single check ever completed.
    const { data: ownedProjects } = await supabase.from('projects').select('id, name').eq('owner_id', profile.id)
    const projectIds = (ownedProjects ?? []).map((p: { id: string }) => p.id)
    let lastRun: WinbackLastRun | null = null
    if (projectIds.length > 0) {
      const { data: runs } = await supabase
        .from('dqs_runs')
        .select('project_id, score_total, run_date')
        .eq('status', 'completed')
        .in('project_id', projectIds)
        .order('run_date', { ascending: false })
        .limit(1)
      const run = runs?.[0]
      if (run) {
        const project = (ownedProjects ?? []).find((p: { id: string }) => p.id === run.project_id)
        lastRun = { score_total: run.score_total, run_date: run.run_date, projectName: project?.name ?? 'your project' }
      }
    }

    try {
      const stripeCustomerId = await ensureStripeCustomer(supabase, profile.id, email)
      const { code, expiresAt } = await createWinbackPromoCode(stripeCustomerId)
      const surveyToken = randomBytes(16).toString('hex')

      const ok = await sendEmail({
        to: email,
        ...renderTrialWinbackEmail({ lastRun, promoCode: code, promoExpiresAt: expiresAt, surveyToken }),
      })
      if (ok) {
        await supabase.from('profiles').update({
          trial_winback_sent_at: now.toISOString(),
          trial_winback_token: surveyToken,
        }).eq('id', profile.id)
        sent++
      }
    } catch (err) {
      // Don't mark sent — a transient Stripe/email failure should retry on
      // tomorrow's run rather than silently skip this person forever.
      console.error('[trial-winback] failed for profile', profile.id, (err as Error).message)
    }
  }

  return NextResponse.json({ ok: true, checked: candidates?.length ?? 0, sent })
}
