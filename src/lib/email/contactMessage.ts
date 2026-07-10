import { emailShell, footerHtml, BRAND, escapeHtml } from './shared'

export interface ContactMessageData {
  name: string
  email: string
  category: string
  message: string
}

// Every field here comes from a public, unauthenticated form — escaped
// before interpolation, unlike the other templates in this folder which
// only ever render server-controlled data.
export function renderContactMessageEmail(d: ContactMessageData): { subject: string; html: string } {
  const name = escapeHtml(d.name)
  const email = escapeHtml(d.email)
  const category = escapeHtml(d.category)
  const message = escapeHtml(d.message).replace(/\n/g, '<br />')

  const subject = `[Kontakt AlertGA4] ${d.category} — ${d.name}`.replace(/[\r\n]+/g, ' ')

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">Nowa wiadomość z formularza kontaktowego</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:22px;font-weight:600;color:${BRAND.ink};margin:4px 0 16px;">${category}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13.5px;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:${BRAND.soft};width:70px;">Imię</td><td style="padding:4px 0;color:${BRAND.ink};font-weight:600;">${name}</td></tr>
        <tr><td style="padding:4px 0;color:${BRAND.soft};">E-mail</td><td style="padding:4px 0;"><a href="mailto:${email}" style="color:${BRAND.coralLink};">${email}</a></td></tr>
      </table>
      <div style="padding:14px 16px;border-radius:8px;background:#f9fafb;border:1px solid ${BRAND.line};font-size:13.5px;color:${BRAND.ink};line-height:1.6;">${message}</div>
    </div>
    ${footerHtml(['Odpowiedz bezpośrednio na tego maila — trafi na adres nadawcy.'])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}
