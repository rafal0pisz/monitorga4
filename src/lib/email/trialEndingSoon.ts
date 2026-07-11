import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

export function renderTrialEndingSoonEmail(trialEndsAt: Date, daysLeft: number): { subject: string; html: string } {
  const subject = `Your AlertGA4 trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · trial ending soon</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        Your 14-day AlertGA4 trial (on Agency terms) ends on <b style="color:${BRAND.ink};">${fmtDate(trialEndsAt)}</b>.
        After that, monitoring keeps your existing data but won't let you add new GA4 properties until you pick a plan.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        Pick a plan before your trial ends to keep monitoring without interruption.
      </p>
    </div>

    ${ctaHtml('View pricing →', `${APP_URL}/cennik`)}

    <div style="padding:0 32px 26px;">
      <p style="font-size:12.5px;color:#6b7278;line-height:1.6;margin:0;">
        Questions about which plan fits you? Write to
        <a href="mailto:kontakt@bettersteps.pl" style="color:${BRAND.coralLink};">kontakt@bettersteps.pl</a> — we're happy to help.
      </p>
    </div>

    ${footerHtml([
      'This email is sent because your AlertGA4 free trial is about to end.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
