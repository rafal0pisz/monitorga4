import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, hstack, fmtDate } from './shared'
import { checkLabel } from '@/lib/ga4/checkLabels'

export interface TrendPoint { runDate: string; score: number }
export interface CheckIssue { checkKey: string; message: string }

export interface ClientAlertData {
  projectId: string
  projectName: string
  shareToken: string
  scoreTotal: number
  prevScore: number | null
  alertThreshold: number
  trend: TrendPoint[] // chronological, oldest → newest, includes today
  failing: CheckIssue[]
  warning: CheckIssue[]
  passingCount: number
  passingLabels: string[]
}

const BAR_HEIGHT = 52
// Confirmed in production: classic Windows desktop Outlook drops inline SVG
// entirely, so the line-chart version rendered nothing there. Back to a
// plain HTML-table bar chart (same technique as every other layout in this
// file) — renders everywhere, including Outlook. Single dark navy colour
// throughout (no red-below-threshold split), matching the "one clean colour,
// no red" direction from the line-chart version.
const NAVY = '#1e3a5f'

function trendHtml(trend: TrendPoint[], threshold: number): string {
  if (trend.length < 2) return ''

  const bars = trend.map(p => ({
    heightPx: Math.max(2, Math.round((p.score / 100) * BAR_HEIGHT)),
    title: `${fmtDate(p.runDate)} · ${Math.round(p.score)}`,
  }))
  const thresholdTop = Math.round(BAR_HEIGHT - (threshold / 100) * BAR_HEIGHT)

  const cells = bars.map(b => `
    <td valign="bottom" style="padding:0 2px;">
      <div title="${b.title}" style="height:${b.heightPx}px;background:${NAVY};border-radius:2px 2px 0 0;font-size:0;line-height:0;">&nbsp;</div>
    </td>`).join('')

  return `
  <div style="padding:20px 32px 4px;">
    <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 10px;font-weight:700;">Trend checks</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="position:relative;">
      <tr><td style="position:relative;padding:0;">
        <div style="position:absolute;left:0;right:0;top:${thresholdTop}px;border-top:1px dashed #c7ccd0;font-size:0;line-height:0;">&nbsp;</div>
        <span style="position:absolute;right:0;top:${thresholdTop}px;transform:translateY(-100%);font-size:9.5px;color:${BRAND.soft};background:#fff;padding:0 4px 1px;">threshold ${threshold}</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:${BAR_HEIGHT}px;">
          <tr>${cells}</tr>
        </table>
      </td></tr>
    </table>
    <div style="margin-top:6px;">${hstack([
      { html: `<span style="font-size:10.5px;color:${BRAND.soft};">${fmtDate(trend[0].runDate)}</span>` },
      { html: `<span style="font-size:10.5px;color:${BRAND.soft};">${fmtDate(trend[trend.length - 1].runDate)}</span>`, align: 'right' },
    ])}</div>
  </div>`
}

function issueRow(issue: CheckIssue, kind: 'fail' | 'warn'): string {
  const bg = kind === 'fail' ? BRAND.alert : '#fbfbf3'
  const tagColor = kind === 'fail' ? BRAND.coralLink : '#8a7c00'
  const row = hstack([
    { html: `<span style="font-size:10px;font-weight:700;letter-spacing:0.04em;color:${tagColor};">${kind === 'fail' ? 'FAIL' : 'WARN'}</span>`, width: 42, valign: 'top' },
    {
      html: `<div style="font-weight:600;color:${BRAND.ink};">${checkLabel(issue.checkKey)}</div><div style="color:#4a5157;margin-top:1px;">${issue.message}</div>`,
      valign: 'top',
    },
  ])
  return `<div style="padding:10px 12px;border-radius:8px;background:${bg};margin-bottom:8px;font-size:13px;">${row}</div>`
}

export function renderClientAlertEmail(d: ClientAlertData): { subject: string; html: string } {
  const subject = `GA4 Quality Alert — ${d.projectName}: score ${Math.round(d.scoreTotal)}, below threshold (${d.alertThreshold})`
  const delta = d.prevScore != null ? Math.round(d.scoreTotal - d.prevScore) : null
  const total = d.failing.length + d.warning.length + d.passingCount

  const scoreHero = hstack([
    { html: `<span class="serif" style="font-size:48px;color:${BRAND.coralText};">${Math.round(d.scoreTotal)}</span>`, width: 90, valign: 'top' },
    {
      html: `
        <div><span style="font-size:10.5px;font-weight:700;color:${BRAND.ink};background:${BRAND.alert};padding:1px 6px;border-radius:4px;">Below threshold</span></div>
        <div style="font-size:12.5px;color:#6b7278;margin-top:6px;">${delta != null ? `<b style="color:${BRAND.ink};">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}</b> vs. yesterday · ` : ''}your alert threshold is <b style="color:${BRAND.ink};">${d.alertThreshold}</b></div>`,
      valign: 'top',
    },
  ])

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 quality alert · issued by Bettersteps</div>

    <div style="padding:6px 32px 22px;border-bottom:1px solid ${BRAND.line};">
      <div class="serif" style="font-size:26px;font-weight:600;color:${BRAND.ink};margin:4px 0 2px;">${d.projectName}</div>
      <p style="font-size:13px;color:#6b7278;margin:0 0 18px;">GA4 property health check · ${fmtDate(new Date())}</p>
      ${scoreHero}
    </div>

    ${trendHtml(d.trend, d.alertThreshold)}

    <div style="padding:22px 32px 6px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 4px;font-weight:700;">Checks</h2>
      <p style="font-size:12.5px;color:#6b7278;margin:0 0 12px;"><b style="color:${BRAND.ink};">${d.passingCount} passing</b> · <b style="color:${BRAND.ink};">${d.warning.length} warning</b> · <b style="color:${BRAND.ink};">${d.failing.length} failing</b> (of ${total})</p>
      ${d.failing.map(i => issueRow(i, 'fail')).join('')}
      ${d.warning.map(i => issueRow(i, 'warn')).join('')}
      ${d.passingCount > 0 ? `
      <div style="font-size:12.5px;color:#6b7278;padding:8px 12px;border-top:1px dashed ${BRAND.line};margin-top:4px;">
        <b style="color:${BRAND.ink};">✓ ${d.passingCount} more check${d.passingCount > 1 ? 's' : ''} passing</b>${d.passingLabels.length ? ` — ${d.passingLabels.map(checkLabel).join(', ')}` : ''}
      </div>` : ''}
    </div>

    ${ctaHtml('View full report →', `${APP_URL}/share/${d.shareToken}`)}

    ${footerHtml([
      `This automated quality report is issued by AlertGA4 on behalf of Bettersteps for ${d.projectName}.`,
      'Questions about this report?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
