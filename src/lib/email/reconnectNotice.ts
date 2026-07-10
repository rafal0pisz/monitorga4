import { emailShell, footerHtml, ctaHtml, BRAND, APP_URL } from './shared'

// Sent directly to a project's owner when their Google connection has died
// (revoked/expired refresh token) and automated daily checks silently stop
// — without this, the owner would only find out via the internal owner
// digest, which they never see.
export function renderReconnectNoticeEmail(projectName: string): { subject: string; html: string } {
  const subject = `Action needed — reconnect Google for ${projectName}`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · connection issue</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Your Google connection needs to be renewed</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        AlertGA4's access to Google Analytics for <b style="color:${BRAND.ink};">${projectName}</b> has expired or been revoked.
        Automated daily checks for this project have stopped running until you reconnect.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        Sign in again to restore automated checks — it only takes a moment.
      </p>
    </div>
    ${ctaHtml('Reconnect Google →', `${APP_URL}/login`)}
    ${footerHtml([
      'This notice is sent because automated daily checks are enabled for this project and can no longer run.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
