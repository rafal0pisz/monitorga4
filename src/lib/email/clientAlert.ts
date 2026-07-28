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

const LINE_HEIGHT = 60
const LINE_WIDTH = 536 // email body is 600px wide with 32px padding each side

// Plain SVG line — Apple Mail, Gmail, Outlook.com/mobile and most other
// clients render this fine; classic Windows desktop Outlook (Word's HTML
// engine) drops inline SVG entirely and shows nothing here. That's an
// acceptable degradation: the score, delta and pass/fail list right above
// and below this chart already carry the same information as plain text.
function trendHtml(trend: TrendPoint[], threshold: number): string {
  if (trend.length < 2) return ''

  const n = trend.length
  const points = trend.map((p, i) => ({
    x: +((i * LINE_WIDTH) / (n - 1)).toFixed(1),
    y: +((1 - p.score / 100) * LINE_HEIGHT).toFixed(1),
    date: p.runDate,
    score: p.score,
  }))
  const thresholdY = +((1 - threshold / 100) * LINE_HEIGHT).toFixed(1)
  const labelY = Math.max(thresholdY - 4, 9)

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = `${linePoints} ${LINE_WIDTH},${LINE_HEIGHT} 0,${LINE_HEIGHT}`
  const dots = points.map((p, i) => {
    const title = `<title>${fmtDate(p.date)} · ${Math.round(p.score)}</title>`
    return i === n - 1
      ? `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${BRAND.ink}" stroke="#ffffff" stroke-width="1.5">${title}</circle>`
      : `<circle cx="${p.x}" cy="${p.y}" r="2.75" fill="${BRAND.ink}">${title}</circle>`
  }).join('')

  return `
  <div style="padding:20px 32px 4px;">
    <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 10px;font-weight:700;">Trend checks</h2>
    <svg width="${LINE_WIDTH}" height="${LINE_HEIGHT}" viewBox="0 0 ${LINE_WIDTH} ${LINE_HEIGHT}" style="display:block;width:100%;height:auto;">
      <line x1="0" y1="${thresholdY}" x2="${LINE_WIDTH}" y2="${thresholdY}" stroke="#c7ccd0" stroke-width="1" stroke-dasharray="3,3" />
      <text x="${LINE_WIDTH}" y="${labelY}" text-anchor="end" font-size="9.5" fill="${BRAND.soft}" font-family="-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif">threshold ${threshold}</text>
      <polygon points="${areaPoints}" fill="${BRAND.ink}" fill-opacity="0.07" />
      <polyline points="${linePoints}" fill="none" stroke="${BRAND.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
    </svg>
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
