import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, hstack, fmtDate } from './shared'
import { checkLabel } from '@/lib/ga4/checkLabels'

export interface CriticalIssue { checkKey: string; status: 'fail' | 'warn'; message: string; label?: string }

export interface CriticalAlertData {
  projectId: string
  projectName: string
  shareToken: string
  // YYYY-MM-DD — the GA4 date these checks actually cover (see
  // getDailyRanges() in app/api/worker/run/route.ts).
  dataDate: string
  issues: CriticalIssue[]
}

function issueRow(issue: CriticalIssue): string {
  const isFail = issue.status === 'fail'
  const bg = isFail ? BRAND.alert : '#fbfbf3'
  const tagColor = isFail ? BRAND.coralLink : '#8a7c00'
  const row = hstack([
    { html: `<span style="font-size:10px;font-weight:700;letter-spacing:0.04em;color:${tagColor};">${isFail ? 'FAIL' : 'WARN'}</span>`, width: 42, valign: 'top' },
    {
      html: `<div style="font-weight:600;color:${BRAND.ink};">${issue.label ?? checkLabel(issue.checkKey)}</div><div style="color:#4a5157;margin-top:1px;">${issue.message}</div>`,
      valign: 'top',
    },
  ])
  return `<div style="padding:10px 12px;border-radius:8px;background:${bg};margin-bottom:8px;font-size:13px;">${row}</div>`
}

// A second, narrower alert than renderClientAlertEmail — this one is
// triggered by hand-picked "critical" metrics going warn/fail, independent
// of the overall score threshold, so the email itself stays focused on
// just those metrics rather than the whole check report.
export function renderCriticalAlertEmail(d: CriticalAlertData): { subject: string; html: string } {
  const failing = d.issues.filter(i => i.status === 'fail')
  const warning = d.issues.filter(i => i.status === 'warn')
  const subject = `⚠ Critical metric alert — ${d.projectName}: ${d.issues.length} metric${d.issues.length > 1 ? 's' : ''} need${d.issues.length > 1 ? '' : 's'} attention`

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 critical metric alert · issued by Bettersteps</div>

    <div style="padding:6px 32px 22px;border-bottom:1px solid ${BRAND.line};">
      <div class="serif" style="font-size:26px;font-weight:600;color:${BRAND.ink};margin:4px 0 2px;">${d.projectName}</div>
      <p style="font-size:13px;color:#6b7278;margin:0 0 8px;">GA4 property health check · data for ${fmtDate(d.dataDate)}</p>
      <p style="font-size:13px;color:#6b7278;margin:0;">
        <b style="color:${BRAND.ink};">${d.issues.length}</b> of your selected critical metric${d.issues.length > 1 ? 's' : ''}
        ${d.issues.length > 1 ? 'are' : 'is'} showing a problem today — this alert only fires for the metrics you specifically chose to watch here, regardless of the overall score.
      </p>
    </div>

    <div style="padding:22px 32px 6px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 4px;font-weight:700;">Critical metrics</h2>
      <p style="font-size:12.5px;color:#6b7278;margin:0 0 12px;"><b style="color:${BRAND.ink};">${failing.length} failing</b> · <b style="color:${BRAND.ink};">${warning.length} warning</b></p>
      ${failing.map(issueRow).join('')}
      ${warning.map(issueRow).join('')}
    </div>

    ${ctaHtml('View full report →', `${APP_URL}/share/${d.shareToken}`)}

    ${footerHtml([
      `This automated critical-metric alert is issued by AlertGA4 on behalf of Bettersteps for ${d.projectName}.`,
      'You are receiving this because this address is configured for critical metric alerts on this project.',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
