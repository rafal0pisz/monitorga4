import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { renderContactMessageEmail } from '@/lib/email/contactMessage'

const CONTACT_TO = 'kontakt@bettersteps.pl'
const CATEGORIES = ['Wsparcie z obsługi', 'Chęć przetestowania aplikacji', 'Błąd w aplikacji', 'Inne']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RATE_LIMIT_WINDOW_MINUTES = 10
const RATE_LIMIT_MAX_PER_WINDOW = 5

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Nieprawidłowe zapytanie' }, { status: 400 })

  // Honeypot — a hidden field real users never fill in; a submission with
  // it set is almost certainly a bot, dropped silently rather than with an
  // error that would just teach the bot to leave it blank.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(request)
  const supabase = createAdminClient()

  // Fail open — a Supabase hiccup here should never block a real person
  // from reaching us, only repeat submissions from the same IP should be.
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('contact_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', windowStart)
    if (countError) throw countError
    if ((count ?? 0) >= RATE_LIMIT_MAX_PER_WINDOW) {
      return NextResponse.json({ error: 'Zbyt wiele zgłoszeń z tego adresu. Spróbuj ponownie za kilka minut.' }, { status: 429 })
    }
  } catch (err) {
    console.error('[contact] Rate limit check failed, allowing through:', err instanceof Error ? err.message : err)
  }

  // Record the attempt against the limit even if validation below rejects
  // it — a script hammering the endpoint with garbage payloads should still
  // get throttled, not just well-formed spam. Best-effort, never blocks.
  // Awaited (not fire-and-forget) since a serverless function can freeze
  // right after it returns a response, which would drop an un-awaited write.
  const { error: insertError } = await supabase.from('contact_submissions').insert({ ip })
  if (insertError) console.error('[contact] Failed to record rate-limit row:', insertError.message)

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : ''

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Uzupełnij imię, e-mail i treść wiadomości' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Podaj poprawny adres e-mail' }, { status: 400 })
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Wybierz kategorię z listy' }, { status: 400 })
  }

  const { subject, html } = renderContactMessageEmail({ name, email, category, message })
  const sent = await sendEmail({ to: CONTACT_TO, subject, html, replyTo: email })

  if (!sent) {
    return NextResponse.json({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
