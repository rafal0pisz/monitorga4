import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { renderContactMessageEmail } from '@/lib/email/contactMessage'

const CONTACT_TO = 'kontakt@bettersteps.pl'
const CATEGORIES = ['Wsparcie z obsługi', 'Chęć przetestowania aplikacji', 'Błąd w aplikacji', 'Inne']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Nieprawidłowe zapytanie' }, { status: 400 })

  // Honeypot — a hidden field real users never fill in; a submission with
  // it set is almost certainly a bot, dropped silently rather than with an
  // error that would just teach the bot to leave it blank.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

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
