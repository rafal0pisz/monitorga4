import { emailShell, footerHtml, ctaHtml, escapeHtml, BRAND, APP_URL } from './shared'

// Sent when an Agency account invites someone to their team (see
// app/api/team/invite/route.ts) — the only way today to get access to
// someone else's projects without sharing a Google login.
export function renderTeamInviteEmail(ownerEmail: string, inviteToken: string): { subject: string; html: string } {
  const safeOwnerEmail = escapeHtml(ownerEmail)
  const subject = `${ownerEmail} invited you to their AlertGA4 team`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · team invite</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">You've been invited to a team</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        <b style="color:${BRAND.ink};">${safeOwnerEmail}</b> invited you to their AlertGA4 team — accepting gives you access to their monitored GA4 properties.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        Sign in with Google to accept — use the same Google account you want to use for AlertGA4 going forward.
      </p>
    </div>
    ${ctaHtml('Accept invite →', `${APP_URL}/invite/${inviteToken}`)}
    ${footerHtml([
      'This invite was sent because someone entered your email address when inviting a team member on AlertGA4.',
      'Didn\'t expect this?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
