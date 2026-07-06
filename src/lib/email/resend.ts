import { Resend } from 'resend'

/**
 * Fire-and-log email send — never throws. A failed alert email must not
 * fail the worker run itself (the check results are already persisted by
 * the time we get here).
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY/RESEND_FROM not configured — skipping send:', opts.subject)
    return
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) console.error('[email] Resend error:', error.message, '—', opts.subject)
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err, '—', opts.subject)
  }
}
