import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { isCronRequest } from '@/lib/worker/cronAuth'
import { AUTO_RUN_MARKER_KEY, currentWarsawDate } from '@/lib/worker/schedule'

export const runtime = 'nodejs'

// Scheduled (vercel.json) well after the daily check's own morning window
// closes, in both DST states — exists to catch the exact failure mode that
// actually happened: the automatic run's own gate silently skipped every
// firing for 7 straight days (3-9 Oct 2026), clients got zero alerts, and
// nobody noticed until one complained. Checks the same app_config marker
// /api/worker/run writes on success; if it doesn't match today's date in
// Poland, the daily run never completed, and the account owner gets a
// direct email instead of finding out from a client.
export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const todayWarsaw = currentWarsawDate()
  const { data, error } = await admin.from('app_config').select('value').eq('key', AUTO_RUN_MARKER_KEY).maybeSingle()

  // A failure reading the marker itself is reported the same as "didn't
  // run" — better a false-positive nudge to go check than staying quiet
  // about a problem we can't actually verify is absent.
  const ranToday = !error && data?.value === todayWarsaw
  if (!ranToday) {
    const ownerEmail = process.env.DIGEST_EMAIL
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: '🚨 AlertGA4: daily check did not run today',
        html: `
          <p>The daily automatic GA4 check has not completed yet today (${todayWarsaw}, Warsaw time), checked at ${new Date().toISOString()} UTC.</p>
          <p>No client alerts can have gone out for today's data until this is fixed. Trigger it immediately, regardless of time of day:</p>
          <pre>curl -X POST https://&lt;your-domain&gt;/api/worker/run -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" -d '{}'</pre>
          ${error ? `<p>Also: the app_config marker lookup itself failed (${error.message}) — that error alone could be why this alert fired, independent of whether the check actually ran.</p>` : ''}
        `,
      })
    } else {
      console.error('[watchdog] Daily check did not run today and DIGEST_EMAIL is not configured — no one was notified.')
    }
  }

  return NextResponse.json({ ok: true, ran_today: ranToday })
}
