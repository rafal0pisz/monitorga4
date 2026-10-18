import { emailShell, footerHtml, ctaHtml, escapeHtml, BRAND, APP_URL } from './shared'

// Sent to everyone else on the team (the owner + any other accepted
// members, minus whoever actually did the deleting) when a shared project
// is deleted — without this, a project a member had access to simply
// vanishes from their dashboard on next load with zero explanation.
export function renderProjectDeletedEmail(projectName: string, actorEmail: string): { subject: string; html: string } {
  const safeProjectName = escapeHtml(projectName)
  const safeActorEmail = escapeHtml(actorEmail)
  const subject = `"${projectName}" was deleted from your AlertGA4 team`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · project removed</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">A shared project was deleted</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        <b style="color:${BRAND.ink};">${safeProjectName}</b> was deleted by <b style="color:${BRAND.ink};">${safeActorEmail}</b>.
        Monitoring has stopped and it's no longer in your dashboard — this can't be undone.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        If this wasn't expected, reach out to the team.
      </p>
    </div>
    ${ctaHtml('Go to dashboard →', `${APP_URL}/dashboard`)}
    ${footerHtml([
      'This notice is sent to everyone who had access to a shared project when it is deleted.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
