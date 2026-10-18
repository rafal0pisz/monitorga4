import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { emailShell, footerHtml, ctaHtml, BRAND, APP_URL } from '@/lib/email/shared'

// One-off admin action for the alertga4.pl domain migration announcement.
// Not a recurring email type — delete this route once the announcement has
// been sent.
export const runtime = 'nodejs'

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}

function renderMigrationNoticeEmail(): { subject: string; html: string } {
  const subject = 'AlertGA4 zmienia adres na alertga4.pl'

  const body = `
    <div style="padding:16px 32px 0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.soft};">AlertGA4 · aktualizacja usługi</div>
    <div style="padding:6px 32px 22px;">
      <div class="serif" style="font-size:24px;font-weight:600;color:${BRAND.ink};margin:4px 0 10px;">Zmieniamy adres na alertga4.pl</div>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        AlertGA4 działa teraz pod nowym adresem <b style="color:${BRAND.ink};">alertga4.pl</b> zamiast alertga4.bettersteps.pl.
        Dotychczasowe linki i zakładki nadal działają — automatycznie przekierowują na nowy adres.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        Własna domena to krok w rozwoju AlertGA4 jako samodzielnego produktu i przygotowuje usługę pod dalszy rozwój i nowe funkcjonalności.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0 0 12px;">
        Zmiana dotyczy wyłącznie adresu internetowego. Warunki Twojego konta, plan i konfiguracja alertów pozostają bez zmian, a wszystkie Twoje projekty są nadal aktywne i monitorowane tak jak dotychczas.
      </p>
      <p style="font-size:13.5px;color:#4a5157;line-height:1.6;margin:0;">
        Jedyna rzecz, jakiej możesz się spodziewać: przy najbliższej wizycie zostaniesz poproszony o ponowne zalogowanie się. To jednorazowy krok wynikający ze zmiany adresu, nie błąd.
      </p>
    </div>
    ${ctaHtml('Zaloguj się na alertga4.pl →', `${APP_URL}/login`)}
    ${footerHtml([
      'Ta wiadomość dotyczy jednorazowej zmiany adresu internetowego konta AlertGA4.',
      'Pytania?',
    ])}
  `

  return { subject, html: emailShell({ preheader: subject, body }) }
}

async function collectRecipientEmails(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data: profileRows, error: profileError } = await admin.from('profiles').select('id')
  if (profileError) throw new Error(`profiles lookup failed: ${profileError.message}`)
  const profileIds = new Set((profileRows ?? []).map((p: { id: string }) => p.id))

  const emails: string[] = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`auth.users lookup failed: ${error.message}`)
    for (const u of data.users) {
      if (profileIds.has(u.id) && u.email) emails.push(u.email)
    }
    if (data.users.length < 1000) break
    page++
  }
  return [...new Set(emails)]
}

export async function GET(request: NextRequest) {
  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  if (!isAdminEmail(authData?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  let emails: string[]
  try {
    emails = await collectRecipientEmails(admin)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  const send = request.nextUrl.searchParams.get('send') === 'true'
  if (!send) {
    return NextResponse.json({ dryRun: true, count: emails.length, emails })
  }

  const { subject, html } = renderMigrationNoticeEmail()
  let sent = 0
  const failedEmails: string[] = []
  for (const to of emails) {
    const ok = await sendEmail({ to, subject, html })
    if (ok) sent++
    else failedEmails.push(to)
    await new Promise(r => setTimeout(r, 150))
  }

  return NextResponse.json({ dryRun: false, total: emails.length, sent, failed: failedEmails.length, failedEmails })
}
