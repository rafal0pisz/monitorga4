import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { renderTrialEndingSoonEmail } from '@/lib/email/trialEndingSoon'

// Same dual-authorization pattern as /api/worker/run — this must be
// callable by Vercel Cron (no session, CRON_SECRET bearer token instead).
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${cronSecret}`) return true
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

// GET — Vercel Cron, once daily. Finds trials ending in the next 1-2 days
// that haven't had a reminder sent yet, emails them, and marks them sent so
// a later run on the same day (or a retry) doesn't email twice.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() + 1 * DAY_MS).toISOString()
  const windowEnd = new Date(now.getTime() + 2 * DAY_MS).toISOString()

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, trial_ends_at')
    .eq('plan_id', 'trial')
    .is('trial_reminder_sent_at', null)
    .gte('trial_ends_at', windowStart)
    .lte('trial_ends_at', windowEnd)

  let sent = 0
  for (const profile of candidates ?? []) {
    if (!profile.trial_ends_at) continue
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    const trialEndsAt = new Date(profile.trial_ends_at)
    const daysLeft = Math.max(1, Math.round((trialEndsAt.getTime() - now.getTime()) / DAY_MS))
    const ok = await sendEmail({ to: email, ...renderTrialEndingSoonEmail(trialEndsAt, daysLeft) })
    if (ok) {
      await supabase.from('profiles').update({ trial_reminder_sent_at: now.toISOString() }).eq('id', profile.id)
      sent++
    }
  }

  return NextResponse.json({ ok: true, checked: candidates?.length ?? 0, sent })
}
