import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

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

function trendHtml(trend: TrendPoint[], threshold: number): string {
  if (trend.length < 2) return ''

  const bars = trend.map((p, i) => {
    const h = Math.max(2, Math.round((p.score / 100) * BAR_HEIGHT))
    const below = p.score < threshold
    const isToday = i === trend.length - 1
    const bg = below ? BRAND.coralText : BRAND.ink
    const opacity = below ? (isToday ? 1 : 0.75) : (isToday ? 1 : 0.32)
    return `<div style="flex:1;height:${h}px;background:${bg};opacity:${opacity};border-radius:2px 2px 0 0;" title="${fmtDate(p.runDate)} · ${Math.round(p.score)}"></div>`
  }).join('')

  const thresholdTop = Math.round(BAR_HEIGHT - (threshold / 100) * BAR_HEIGHT)

  return `
  <div style="padding:20px 32px 4px;">
    <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 10px;font-weight:700;">${trend.length}-day trend</h2>
    <div style="position:relative;height:${BAR_HEIGHT}px;margin-bottom:6px;">
      <div style="position:absolute;left:0;right:0;top:${thresholdTop}px;border-top:1px dashed #c7ccd0;"></div>
      <span style="position:absolute;right:0;top:${thresholdTop}px;transform:translateY(-100%);font-size:9.5px;color:${BRAND.soft};background:#fff;padding:0 4px 1px;">threshold ${threshold}</span>
      <div style="display:flex;align-items:flex-end;gap:5px;height:${BAR_HEIGHT}px;">${bars}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10.5px;color:${BRAND.soft};">
      <span>${fmtDate(trend[0].runDate)}</span>
      <span>${fmtDate(trend[trend.length - 1].runDate)}</span>
    </div>
  </div>`
}

function issueRow(issue: CheckIssue, kind: 'fail' | 'warn'): string {
  const bg = kind === 'fail' ? BRAND.alert : '#fbfbf3'
  const border = kind === 'fail' ? '#ece94a' : BRAND.line
  const tagBg = kind === 'fail' ? BRAND.ink : '#e7e8e6'
  const tagColor = kind === 'fail' ? BRAND.alert : '#5c6066'
  return `
  <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:8px;border:1px solid ${border};background:${bg};margin-bottom:8px;font-size:13px;">
    <span style="flex:none;font-size:9.5px;font-weight:700;letter-spacing:0.03em;padding:2px 6px;border-radius:4px;margin-top:1px;background:${tagBg};color:${tagColor};">${kind.toUpperCase()}</span>
    <div>
      <div style="font-weight:600;color:${BRAND.ink};">${issue.checkKey}</div>
      <div style="color:#4a5157;margin-top:1px;">${issue.message}</div>
    </div>
  </div>`
}

export function renderClientAlertEmail(d: ClientAlertData): { subject: string; html: string } {
  const subject = `GA4 Quality Alert — ${d.projectName}: score ${Math.round(d.scoreTotal)}, below threshold (${d.alertThreshold})`
  const delta = d.prevScore != null ? Math.round(d.scoreTotal - d.prevScore) : null
  const total = d.failing.length + d.warning.length + d.passingCount

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 quality alert · issued by Bettersteps</div>

    <div style="padding:6px 32px 22px;border-bottom:1px solid ${BRAND.line};">
      <div class="serif" style="font-size:26px;font-weight:600;color:${BRAND.ink};margin:4px 0 2px;">${d.projectName}</div>
      <p style="font-size:13px;color:#6b7278;margin:0 0 18px;">GA4 property health check · ${fmtDate(new Date())}</p>

      <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
        <div class="serif" style="font-size:48px;line-height:1;color:${BRAND.coralText};font-variant-numeric:tabular-nums;">${Math.round(d.scoreTotal)}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:10.5px;font-weight:700;color:${BRAND.ink};background:${BRAND.alert};border:1px solid #ece94a;padding:1px 6px;border-radius:5px;letter-spacing:0.02em;width:fit-content;">BELOW THRESHOLD</span>
          <span style="font-size:12.5px;color:#6b7278;">${delta != null ? `<b style="color:${BRAND.ink};">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}</b> vs. yesterday · ` : ''}your alert threshold is <b style="color:${BRAND.ink};">${d.alertThreshold}</b></span>
        </div>
      </div>
    </div>

    ${trendHtml(d.trend, d.alertThreshold)}

    <div style="padding:22px 32px 6px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 4px;font-weight:700;">Checks</h2>
      <p style="font-size:12.5px;color:#6b7278;margin:0 0 12px;"><b style="color:${BRAND.ink};">${d.passingCount} passing</b> · <b style="color:${BRAND.ink};">${d.warning.length} warning</b> · <b style="color:${BRAND.ink};">${d.failing.length} failing</b> (of ${total})</p>
      ${d.failing.map(i => issueRow(i, 'fail')).join('')}
      ${d.warning.map(i => issueRow(i, 'warn')).join('')}
      ${d.passingCount > 0 ? `
      <div style="font-size:12.5px;color:#6b7278;padding:8px 12px;border-top:1px dashed ${BRAND.line};margin-top:4px;">
        <b style="color:${BRAND.ink};">✓ ${d.passingCount} more check${d.passingCount > 1 ? 's' : ''} passing</b>${d.passingLabels.length ? ` — ${d.passingLabels.join(', ')}` : ''}
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
