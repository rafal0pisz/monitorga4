import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

export function renderPurchaseConfirmationEmail(opts: {
  planName: string
  cycle: 'monthly' | 'yearly'
  currentPeriodEnd: Date | null
}): { subject: string; html: string } {
  const subject = `Thanks for your purchase — AlertGA4 ${opts.planName}`
  const cycleLabel = opts.cycle === 'yearly' ? 'yearly' : 'monthly'

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · purchase confirmed</div>
    <div style="padding:6px 32px 4px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Thank you for your purchase</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 4px;">
        You're now on the <b style="color:${BRAND.ink};">${opts.planName}</b> plan, billed ${cycleLabel}.
        ${opts.currentPeriodEnd
          ? `Your current billing period runs until <b style="color:${BRAND.ink};">${fmtDate(opts.currentPeriodEnd)}</b>, when it renews automatically.`
          : `Your subscription is now active.`}
      </p>
    </div>

    <div style="padding:14px 32px 4px;">
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        Your invoice is available any time under <b style="color:${BRAND.ink};">Billing</b> in your account — go to
        Dashboard → Billing to view or download it.
      </p>
    </div>

    ${ctaHtml('View your billing →', `${APP_URL}/dashboard/billing`)}

    <div style="padding:0 32px 26px;">
      <p style="font-size:12.5px;color:#6b7278;line-height:1.6;margin:0;">
        Questions about your plan or billing? Just reply to this email or write to
        <a href="mailto:kontakt@bettersteps.pl" style="color:${BRAND.coralLink};">kontakt@bettersteps.pl</a> — we're happy to help.
      </p>
    </div>

    ${footerHtml([
      'This email confirms a purchase made on your AlertGA4 account.',
      'Questions?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
