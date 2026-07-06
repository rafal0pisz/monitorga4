// Bettersteps brand tokens, shared by every outbound email template.
// Keep the email body on a fixed white background — this is a brand
// requirement, not a theme choice, and matches how HTML email actually
// renders (most clients ignore the recipient's OS/app dark mode for
// email bodies anyway).
export const BRAND = {
  ink: '#232b31',      // rgb(35, 43, 49) — footer + primary text
  alert: '#fffd73',    // rgb(255, 253, 115) — "needs attention" highlight
  coral: '#ff8282',    // rgb(255, 130, 130) — secondary accent
  coralText: '#e2564e', // darker, text-safe shade of --coral for readable text/links
  coralLink: '#a8331f',
  soft: '#9aa0a6',
  line: '#edeeef',
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://alertga4.bettersteps.pl'

const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif`
const SANS = `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, ui-sans-serif, sans-serif`

export function emailShell(opts: { preheader?: string; body: string }): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; background: #f4f4f5; font-family: ${SANS}; }
  .email { max-width: 600px; margin: 0 auto; background: #ffffff; color: ${BRAND.ink}; }
  .serif { font-family: ${SERIF}; }
  a { color: ${BRAND.coralLink}; }
</style>
</head>
<body>
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ''}
  <div class="email">
    ${opts.body}
  </div>
</body>
</html>`
}

export function footerHtml(lines: string[]): string {
  return `
  <div style="padding:22px 32px 26px;background:${BRAND.ink};color:#aab0b5;font-size:11.5px;line-height:1.7;">
    ${lines.map((l, i) => `<div style="${i === 0 ? `color:#d7dadc;margin-bottom:8px;` : ''}">${l}</div>`).join('')}
    <div style="margin-top:10px;">
      <a href="mailto:kontakt@bettersteps.pl" style="color:#ffb3ac;text-decoration:none;">kontakt@bettersteps.pl</a>
      <span style="color:#4a545b;margin:0 6px;">·</span>
      <a href="https://www.bettersteps.pl" style="color:#ffb3ac;text-decoration:none;">www.bettersteps.pl</a>
    </div>
  </div>`
}

export function ctaHtml(label: string, href: string): string {
  return `
  <div style="padding:26px 32px 30px;">
    <a href="${href}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;font-size:13.5px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:7px;">${label}</a>
  </div>`
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
