// Bettersteps brand tokens, shared by every outbound email template.
//
// Layout note: everything here is built with HTML tables, not flexbox/grid.
// Gmail, Outlook and most mail clients strip or ignore modern layout CSS —
// tables are the only reliably-supported way to place things side by side
// in an email body.
export const BRAND = {
  ink: '#232b31',      // rgb(35, 43, 49) — footer + primary text
  alert: '#fffd73',    // rgb(255, 253, 115) — "needs attention" highlight
  coral: '#ff8282',    // rgb(255, 130, 130) — secondary accent
  coralText: '#c23b34', // darker, text-safe shade of --coral for readable text/numbers
  coralLink: '#a8331f',
  soft: '#9aa0a6',
  line: '#edeeef',
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alertga4.bettersteps.pl'

const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif`
const SANS = `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, ui-sans-serif, sans-serif`

export function emailShell(opts: { preheader?: string; body: string }): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body, table, td { font-family: ${SANS}; }
  .serif { font-family: ${SERIF}; }
  a { color: ${BRAND.coralLink}; }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;color:${BRAND.ink};">
          <tr><td>${opts.body}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Horizontal layout via a table row — the email-safe replacement for
// `display:flex`. Each cell can pin a width; the last cell without a width
// stretches to fill the remaining space.
export function hstack(cells: { html: string; width?: number; align?: 'left' | 'right' | 'center'; valign?: 'top' | 'middle' | 'bottom' }[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${
    cells.map(c => `<td${c.width ? ` width="${c.width}"` : ''} align="${c.align ?? 'left'}" valign="${c.valign ?? 'middle'}">${c.html}</td>`).join('')
  }</tr></table>`
}

export function footerHtml(lines: string[]): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.ink};">
    <tr><td style="padding:22px 32px 26px;color:#aab0b5;font-size:11.5px;line-height:1.7;">
      ${lines.map((l, i) => `<div style="${i === 0 ? `color:#d7dadc;margin-bottom:8px;` : ''}">${l}</div>`).join('')}
      <div style="margin-top:10px;">
        <a href="mailto:kontakt@bettersteps.pl" style="color:#ffb3ac;text-decoration:none;">kontakt@bettersteps.pl</a>
        <span style="color:#4a545b;margin:0 6px;">·</span>
        <a href="https://www.bettersteps.pl" style="color:#ffb3ac;text-decoration:none;">www.bettersteps.pl</a>
      </div>
    </td></tr>
  </table>`
}

export function ctaHtml(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 32px 30px;">
    <tr><td style="border-radius:7px;background:${BRAND.ink};">
      <a href="${href}" style="display:inline-block;color:#ffffff;font-size:13.5px;font-weight:600;text-decoration:none;padding:11px 20px;">${label}</a>
    </td></tr>
  </table>`
}

// Simple bar chart built from a table — one <td> per bar, bottom-aligned,
// each holding a fixed-height colored block. No flexbox, no images.
export function barChartHtml(bars: { heightPx: number; color: string; title: string }[], frameHeightPx: number, thresholdTopPx: number, thresholdLabel: string): string {
  const cells = bars.map(b => `
    <td valign="bottom" style="padding:0 2px;">
      <div title="${b.title}" style="height:${b.heightPx}px;background:${b.color};border-radius:2px 2px 0 0;font-size:0;line-height:0;">&nbsp;</div>
    </td>`).join('')

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="position:relative;">
    <tr><td style="position:relative;padding:0;">
      <div style="position:absolute;left:0;right:0;top:${thresholdTopPx}px;border-top:1px dashed #c7ccd0;font-size:0;line-height:0;">&nbsp;</div>
      <span style="position:absolute;right:0;top:${thresholdTopPx}px;transform:translateY(-100%);font-size:9.5px;color:${BRAND.soft};background:#fff;padding:0 4px 1px;">${thresholdLabel}</span>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:${frameHeightPx}px;">
        <tr>${cells}</tr>
      </table>
    </td></tr>
  </table>`
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// projects.alert_email stores a free-text, comma/semicolon/whitespace
// separated list (a project can notify several people) — this is the one
// place that turns it into a clean, deduped array of individual addresses.
export function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean))]
}

// Escapes text interpolated into email HTML. Required for any field that
// can come from a public, unauthenticated form (e.g. the contact form) —
// every other template here only interpolates server-controlled data.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
