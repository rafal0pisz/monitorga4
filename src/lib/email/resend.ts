import { Resend } from 'resend'

/**
 * Fire-and-log email send — never throws. A failed alert email must not
 * fail the worker run itself (the check results are already persisted by
 * the time we get here). Returns whether the send actually went through,
 * for callers that DO need to know (e.g. the contact form, where the email
 * is the only delivery mechanism and a silent failure would strand the
 * submitter's message with no feedback).
 */
export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY/RESEND_FROM not configured — skipping send:', opts.subject)
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    })
    if (error) { console.error('[email] Resend error:', error.message, '—', opts.subject); return false }
    return true
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err, '—', opts.subject)
    return false
  }
}
