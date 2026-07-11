import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

const FEATURES = [
  'Monitor up to 100 GA4 properties',
  'Daily automated monitoring, no manual checks needed',
  'Unlimited custom event, e-commerce and parameter checks per property',
  'Email alerts the moment something looks wrong',
  'Configuration wizard with suggestions pulled from your own GA4 data',
]

export function renderTrialWelcomeEmail(trialEndsAt: Date): { subject: string; html: string } {
  const subject = 'Your 14-day AlertGA4 trial has started'

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · trial started</div>
    <div style="padding:6px 32px 4px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Thanks for starting your trial</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 4px;">
        Your account now runs on Agency terms for the next <b style="color:${BRAND.ink};">14 days</b> — no card required.
        Your trial ends on <b style="color:${BRAND.ink};">${fmtDate(trialEndsAt)}</b>.
      </p>
    </div>

    <div style="padding:14px 32px 22px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 12px;font-weight:700;">What's included</h2>
      ${FEATURES.map(f => `
        <div style="padding:9px 0;border-top:1px solid ${BRAND.line};font-size:13.5px;color:${BRAND.ink};">
          <span style="color:#16a34a;font-weight:700;margin-right:8px;">✓</span>${f}
        </div>`).join('')}
    </div>

    ${ctaHtml('Go to your dashboard →', `${APP_URL}/dashboard`)}

    <div style="padding:0 32px 26px;">
      <p style="font-size:12.5px;color:#6b7278;line-height:1.6;margin:0;">
        Questions, or need help getting set up? Just reply to this email or write to
        <a href="mailto:kontakt@bettersteps.pl" style="color:${BRAND.coralLink};">kontakt@bettersteps.pl</a> — we're happy to help.
      </p>
    </div>

    ${footerHtml([
      'This email confirms the free trial you started on your AlertGA4 account.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
