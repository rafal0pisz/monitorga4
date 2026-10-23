import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, hstack, fmtDate, escapeHtml } from './shared'
import { checkLabel, checkCategory, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/ga4/checkLabels'

export interface TrendPoint { runDate: string; score: number }
// streakDays: consecutive days (including today) this check has been
// warn/fail, capped by the worker's lookback window. Only meaningful for
// failing/warning issues — defaults to 1 ("new today") when not supplied.
export interface CheckIssue { checkKey: string; message: string; streakDays?: number }
export interface CheckStatus { checkKey: string; status: 'pass' | 'warn' | 'fail' }

export interface ClientAlertData {
  projectId: string
  projectName: string
  shareToken: string
  scoreTotal: number
  prevScore: number | null
  alertThreshold: number
  // YYYY-MM-DD — the GA4 date these checks actually cover. The daily
  // worker always checks data from 2 days ago, not "yesterday" (GA4 data
  // for yesterday is often still incomplete/processing) — showing this
  // explicitly avoids the report implying it reflects yesterday's traffic.
  dataDate: string
  trend: TrendPoint[] // chronological, oldest → newest, includes today
  failing: CheckIssue[]
  warning: CheckIssue[]
  passingCount: number
  passingLabels: string[]
  // Every check this run produced (checkKey + status only) — drives the
  // "By category" scorecard. Only categories with at least one check
  // actually run for this project are shown.
  allChecks: CheckStatus[]
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

function streakBadge(streakDays: number): string {
  const label = streakDays <= 1 ? 'New today' : `${streakDays}${streakDays === 2 ? 'nd' : streakDays === 3 ? 'rd' : 'th'} day in a row`
  const bg = streakDays <= 1 ? '#eef1f3' : '#f3e8d8'
  const fg = streakDays <= 1 ? '#5b6267' : '#8a5a1c'
  return `<span style="font-size:9.5px;font-weight:700;color:${fg};background:${bg};padding:2px 6px;border-radius:10px;white-space:nowrap;">${label}</span>`
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
    { html: streakBadge(issue.streakDays ?? 1), width: 92, align: 'right', valign: 'top' },
  ])
  return `<div style="padding:10px 12px;border-radius:8px;background:${bg};margin-bottom:8px;font-size:13px;">${row}</div>`
}

function categoryDot(status: 'ok' | 'warn' | 'fail'): string {
  const color = status === 'fail' ? BRAND.coralLink : status === 'warn' ? '#a8831c' : '#2f7a4f'
  return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:6px;"></span>`
}

function scorecardHtml(allChecks: CheckStatus[]): string {
  const byCategory = CATEGORY_ORDER.map(cat => allChecks.filter(c => checkCategory(c.checkKey) === cat))
    .map((checks, i) => ({ cat: CATEGORY_ORDER[i], checks }))
    .filter(c => c.checks.length > 0)
  if (byCategory.length === 0) return ''

  const tiles = byCategory.map(({ cat, checks }) => {
    const failCount = checks.filter(c => c.status === 'fail').length
    const warnCount = checks.filter(c => c.status === 'warn').length
    const status: 'ok' | 'warn' | 'fail' = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'ok'
    const note = status === 'ok'
      ? 'All clear'
      : [failCount > 0 ? `${failCount} failing` : '', warnCount > 0 ? `${warnCount} warning` : ''].filter(Boolean).join(', ')
    const noteColor = status === 'fail' ? BRAND.coralLink : status === 'warn' ? '#8a7c00' : '#6b7278'
    return `
      <td width="${Math.floor(100 / 3)}%" style="padding:4px;">
        <div style="border:1px solid ${BRAND.line};border-radius:8px;padding:10px 12px;">
          <div style="font-size:11px;font-weight:700;color:${BRAND.ink};margin-bottom:3px;">${categoryDot(status)}${CATEGORY_LABEL[cat]}</div>
          <div style="font-size:11px;color:${noteColor};">${note}</div>
        </div>
      </td>`
  })

  const rows: string[] = []
  for (let i = 0; i < tiles.length; i += 3) rows.push(`<tr>${tiles.slice(i, i + 3).join('')}</tr>`)

  return `
  <div style="padding:20px 32px 4px;">
    <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 10px;font-weight:700;">By category</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>
  </div>`
}

function categoryBlock(label: string, items: { issue: CheckIssue; kind: 'fail' | 'warn' }[]): string {
  if (!items.length) return ''
  return `
    <div style="margin-bottom:14px;">
      <div style="font-size:11.5px;font-weight:700;color:${BRAND.ink};margin-bottom:6px;">${label}</div>
      ${items.map(i => issueRow(i.issue, i.kind)).join('')}
    </div>`
}

export function renderClientAlertEmail(d: ClientAlertData): { subject: string; html: string } {
  // Sent every day by default now, not just when the score drops below
  // d.alertThreshold (that's kept only as a displayed stat below) — so the
  // subject/hero badge reflect whether THIS run actually found anything,
  // not a score cutoff that often had nothing to do with it.
  const hasIssues = d.failing.length > 0 || d.warning.length > 0
  const subject = `AlertGA4 Daily Report — ${d.projectName}: score ${Math.round(d.scoreTotal)}${hasIssues ? ', issues found' : ', all clear'}`
  const delta = d.prevScore != null ? Math.round(d.scoreTotal - d.prevScore) : null
  const total = d.failing.length + d.warning.length + d.passingCount

  const issuesByCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: [
      ...d.failing.filter(i => checkCategory(i.checkKey) === cat).map(issue => ({ issue, kind: 'fail' as const })),
      ...d.warning.filter(i => checkCategory(i.checkKey) === cat).map(issue => ({ issue, kind: 'warn' as const })),
    ],
  })).filter(c => c.items.length > 0)

  const scoreHero = hstack([
    { html: `<span class="serif" style="font-size:48px;color:${hasIssues ? BRAND.coralText : BRAND.ink};">${Math.round(d.scoreTotal)}</span>`, width: 90, valign: 'top' },
    {
      html: `
        <div><span style="font-size:10.5px;font-weight:700;color:${BRAND.ink};background:${hasIssues ? BRAND.alert : '#e3f3e9'};padding:1px 6px;border-radius:4px;">${hasIssues ? 'Needs attention' : 'All clear'}</span></div>
        <div style="font-size:12.5px;color:#6b7278;margin-top:6px;">${delta != null ? `<b style="color:${BRAND.ink};">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}</b> vs. yesterday · ` : ''}configured alert threshold: <b style="color:${BRAND.ink};">${d.alertThreshold}</b></div>`,
      valign: 'top',
    },
  ])

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 quality alert</div>

    <div style="padding:6px 32px 22px;border-bottom:1px solid ${BRAND.line};">
      <div class="serif" style="font-size:26px;font-weight:600;color:${BRAND.ink};margin:4px 0 2px;">${escapeHtml(d.projectName)}</div>
      <p style="font-size:13px;color:#6b7278;margin:0 0 18px;">GA4 property health check · data for ${fmtDate(d.dataDate)}</p>
      ${scoreHero}
    </div>

    ${scorecardHtml(d.allChecks)}

    ${trendHtml(d.trend, d.alertThreshold)}

    <div style="padding:22px 32px 6px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${BRAND.soft};margin:0 0 4px;font-weight:700;">Checks</h2>
      <p style="font-size:12.5px;color:#6b7278;margin:0 0 12px;"><b style="color:${BRAND.ink};">${d.passingCount} passing</b> · <b style="color:${BRAND.ink};">${d.warning.length} warning</b> · <b style="color:${BRAND.ink};">${d.failing.length} failing</b> (of ${total})</p>
      ${issuesByCategory.map(c => categoryBlock(CATEGORY_LABEL[c.cat], c.items)).join('')}
      ${d.passingCount > 0 ? `
      <div style="font-size:12.5px;color:#6b7278;padding:8px 12px;border-top:1px dashed ${BRAND.line};margin-top:4px;">
        <b style="color:${BRAND.ink};">✓ ${d.passingCount} more check${d.passingCount > 1 ? 's' : ''} passing</b>${d.passingLabels.length ? ` — ${d.passingLabels.map(checkLabel).join(', ')}` : ''}
      </div>` : ''}
    </div>

    ${ctaHtml('View full report →', `${APP_URL}/share/${d.shareToken}`)}

    ${footerHtml(
      [
        `This automated quality report is issued by AlertGA4 on behalf of Bettersteps for ${escapeHtml(d.projectName)}.`,
        'Questions about this report?',
      ],
      { label: 'alertga4.pl/kontakt', href: `${APP_URL}/kontakt` }
    )}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
