import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

export interface WinbackLastRun {
  score_total: number | null
  run_date: string
  projectName: string
}

export function renderTrialWinbackEmail(opts: {
  lastRun: WinbackLastRun | null
  promoCode: string
  promoExpiresAt: Date
  surveyToken: string
}): { subject: string; html: string } {
  const subject = 'A 30% welcome-back offer for AlertGA4'

  const recapHtml = opts.lastRun
    ? `<p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        During your trial, <b style="color:${BRAND.ink};">${opts.lastRun.projectName}</b> last scored
        <b style="color:${BRAND.ink};">${Math.round(opts.lastRun.score_total ?? 0)}/100</b> on
        ${fmtDate(opts.lastRun.run_date)}. Whatever that check found hasn't been monitored since your trial ended.
      </p>`
    : ''

  const surveyUrl = (reason: string) => `${APP_URL}/api/trial-winback/survey?token=${opts.surveyToken}&reason=${encodeURIComponent(reason)}`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · welcome back</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Your trial ended — here's 30% off to come back</div>
      ${recapHtml}
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 4px;">
        If now's a better time, here's 30% off your first month or year:
      </p>
      <div style="text-align:center;margin:16px 0 8px;">
        <span style="display:inline-block;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:0.04em;color:${BRAND.ink};background:#f4f4f5;border:1px dashed #c6cacd;border-radius:8px;padding:10px 18px;">${opts.promoCode}</span>
      </div>
      <p style="font-size:12px;color:#6b7278;line-height:1.6;margin:0;text-align:center;">
        Valid until ${fmtDate(opts.promoExpiresAt)} — enter it at checkout on the pricing page.
      </p>
    </div>

    ${ctaHtml('View pricing →', `${APP_URL}/cennik`)}

    <div style="padding:0 32px 28px;">
      <p style="font-size:12.5px;color:#6b7278;line-height:1.6;margin:0 0 10px;">Not coming back? One click tells us why — it helps us improve:</p>
      <div style="font-size:12.5px;line-height:2;">
        <a href="${surveyUrl('price')}" style="color:${BRAND.coralLink};margin-right:12px;">Too expensive</a>
        <a href="${surveyUrl('no_time')}" style="color:${BRAND.coralLink};margin-right:12px;">Didn't have time to try it</a>
        <a href="${surveyUrl('not_needed')}" style="color:${BRAND.coralLink};margin-right:12px;">Don't need this tool</a>
        <a href="${surveyUrl('other')}" style="color:${BRAND.coralLink};">Other reason</a>
      </div>
    </div>

    ${footerHtml([
      'This email is sent once, because your AlertGA4 free trial recently ended.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
