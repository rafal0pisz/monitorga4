import { BRAND, APP_URL, emailShell, footerHtml, ctaHtml, fmtDate } from './shared'

export interface DigestEntry {
  projectId: string
  name: string
  runStatus: 'completed' | 'failed'
  errorMessage?: string | null
  checkErrors: { checkKey: string; message: string }[]
  scoreTotal: number | null
  prevScore: number | null
  topSignal: string
  belowThreshold: boolean
  alertThreshold: number
}

function scoreColor(score: number): string {
  return score < 60 ? BRAND.coralText : BRAND.ink
}

function deltaHtml(curr: number | null, prev: number | null): string {
  if (curr == null || prev == null) return `<span style="font-size:12px;color:${BRAND.soft};background:#f2f3f3;padding:2px 7px;border-radius:100px;">—</span>`
  const delta = Math.round(curr - prev)
  if (delta === 0) return `<span style="font-size:12px;color:${BRAND.soft};background:#f2f3f3;padding:2px 7px;border-radius:100px;">— 0</span>`
  const up = delta > 0
  const bg = up ? '#eceeef' : '#fdeceb'
  const color = up ? '#4a5157' : '#c23b34'
  return `<span style="font-size:12px;font-weight:600;color:${color};background:${bg};padding:2px 7px;border-radius:100px;">${up ? '▲' : '▼'} ${Math.abs(delta)}</span>`
}

function runRow(e: DigestEntry): string {
  const hasIssue = e.runStatus === 'failed' || e.checkErrors.length > 0
  const bg = hasIssue ? `background:${BRAND.alert};border-color:#ece94a;` : ''
  const mark = hasIssue
    ? `<span style="flex:none;width:16px;height:16px;border-radius:50%;background:${BRAND.ink};color:${BRAND.alert};display:inline-flex;align-items:center;justify-content:center;font-size:10px;">!</span>`
    : `<span style="flex:none;width:16px;height:16px;border-radius:50%;background:${BRAND.ink};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;">✓</span>`

  let note = ''
  if (e.runStatus === 'failed') {
    note = `<span style="color:#5c5400;display:block;margin-top:2px;font-size:12.5px;">Run failed: ${e.errorMessage ?? 'unknown error'}</span>`
  } else if (e.checkErrors.length > 0) {
    const first = e.checkErrors[0]
    note = `<span style="color:#5c5400;display:block;margin-top:2px;font-size:12.5px;">${first.checkKey}: ${first.message}${e.checkErrors.length > 1 ? ` (+${e.checkErrors.length - 1} more)` : ''}</span>`
  }

  const statusText = e.runStatus === 'failed'
    ? 'failed to complete'
    : e.checkErrors.length > 0
      ? `completed with ${e.checkErrors.length} check error${e.checkErrors.length > 1 ? 's' : ''}`
      : 'completed, all checks ran'

  return `
  <div style="display:flex;align-items:flex-start;gap:10px;font-size:13.5px;padding:9px 12px;border-radius:8px;border:1px solid ${BRAND.line};${bg}margin-bottom:8px;">
    ${mark}
    <span style="color:#3a4046;"><b style="color:${BRAND.ink};">${e.name}</b> — ${statusText}${note}</span>
  </div>`
}

function scoreRow(e: DigestEntry): string {
  const badgeLabel = e.runStatus === 'failed' ? 'RUN FAILED' : e.belowThreshold ? 'BELOW THRESHOLD' : null
  const badge = badgeLabel
    ? `<span style="font-size:10.5px;font-weight:700;color:${BRAND.ink};background:${BRAND.alert};border:1px solid #ece94a;padding:1px 6px;border-radius:5px;letter-spacing:0.02em;">${badgeLabel}</span>`
    : ''
  const num = e.scoreTotal != null ? Math.round(e.scoreTotal) : '—'
  const color = e.scoreTotal != null ? scoreColor(e.scoreTotal) : BRAND.soft

  return `
  <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid #f2f3f3;">
    <div class="serif" style="font-size:26px;font-variant-numeric:tabular-nums;width:54px;text-align:right;flex:none;color:${color};">${num}</div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-weight:600;font-size:14.5px;color:${BRAND.ink};">${e.name}</span>${badge}
      </div>
      <div style="font-size:12.5px;color:${BRAND.soft};margin-top:2px;">${e.topSignal}</div>
    </div>
    ${deltaHtml(e.scoreTotal, e.prevScore)}
  </div>`
}

export function renderOwnerDigestEmail(entries: DigestEntry[], runDate: string): { subject: string; html: string } {
  const attention = entries.filter(e => e.runStatus === 'failed' || e.belowThreshold)
  const healthy = entries.length - attention.length
  const dateLabel = fmtDate(runDate)

  const subject = attention.length === 0
    ? `AlertGA4 Daily Report — ${dateLabel} · all projects healthy`
    : `AlertGA4 Daily Report — ${dateLabel} · ${attention.length} project${attention.length > 1 ? 's' : ''} need${attention.length > 1 ? '' : 's'} attention`

  const calloutHtml = attention.length === 0 ? '' : `
  <div style="margin:18px 32px 0;background:${BRAND.alert};border-left:3px solid ${BRAND.ink};border-radius:8px;padding:14px 16px;">
    <h3 style="margin:0 0 6px;font-size:13.5px;color:${BRAND.ink};">Worth checking</h3>
    ${attention.map(e => `
      <p style="margin:0 0 8px;font-size:13px;color:#3a4046;line-height:1.5;">
        <b>${e.name}</b>${e.scoreTotal != null ? ` scored ${Math.round(e.scoreTotal)}, below its alert threshold of ${e.alertThreshold}.` : ` failed to complete its run — ${e.errorMessage ?? 'unknown error'}.`}
        ${e.topSignal ? `${e.topSignal} — ` : ''}
        <a href="${APP_URL}/project/${e.projectId}" style="font-weight:600;color:${BRAND.coralLink};text-decoration:none;">Open in dashboard →</a>
      </p>`).join('')}
  </div>`

  const body = `
    <div style="padding:28px 32px 22px;border-bottom:1px solid ${BRAND.line};display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="serif" style="font-size:22px;font-weight:600;letter-spacing:0.01em;color:${BRAND.ink};">Alert<span style="color:${BRAND.coralText};">GA4</span></div>
      <div style="font-size:12.5px;color:${BRAND.soft};">${new Date(runDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · 23:00 UTC run</div>
    </div>

    <div style="padding:18px 32px;background:#fafafa;border-bottom:1px solid ${BRAND.line};font-size:14px;color:#3a4046;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <b class="serif" style="font-size:16px;color:${BRAND.ink};">${entries.length} project${entries.length === 1 ? '' : 's'} checked</b>
      <span style="font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px;background:#eceeef;color:#4a5157;">${healthy} healthy</span>
      ${attention.length > 0 ? `<span style="font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:100px;background:${BRAND.alert};color:${BRAND.ink};border:1px solid #ece94a;">${attention.length} needs attention</span>` : ''}
    </div>

    <div style="padding:24px 32px 4px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:0.09em;color:${BRAND.soft};margin:0 0 14px;font-weight:700;">Run status</h2>
      ${entries.map(runRow).join('')}
    </div>

    <div style="padding:8px 32px 4px;">
      <h2 style="font-size:11px;text-transform:uppercase;letter-spacing:0.09em;color:${BRAND.soft};margin:0 0 14px;font-weight:700;">Scores</h2>
      ${entries.map(scoreRow).join('')}
    </div>

    ${calloutHtml}
    ${ctaHtml('View full dashboard', `${APP_URL}/dashboard`)}
    ${footerHtml([
      'Automated daily report from AlertGA4, generated after the 23:00 UTC check run.',
      'Per-project alert emails (for scores under threshold) continue to send separately.',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
