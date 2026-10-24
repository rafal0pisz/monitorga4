'use client'

import { useState } from 'react'
import { useTrackedError } from '@/lib/analytics/useTrackedError'
import type { Locale } from '@/lib/i18n/routes'

// The submitted `value` stays the canonical Polish string regardless of
// display language — app/api/contact/route.ts validates against that exact
// Polish CATEGORIES array, and any admin-side filtering by category relies
// on it staying stable. Only the visible `label` changes with locale.
const CATEGORIES = [
  { value: 'Wsparcie z obsługi', label: { pl: 'Wsparcie z obsługi', en: 'Support' } },
  { value: 'Chęć przetestowania aplikacji', label: { pl: 'Chęć przetestowania aplikacji', en: 'Interested in a trial' } },
  { value: 'Błąd w aplikacji', label: { pl: 'Błąd w aplikacji', en: 'Bug report' } },
  { value: 'Inne', label: { pl: 'Inne', en: 'Other' } },
]

const STRINGS = {
  pl: {
    name: 'Imię', namePlaceholder: 'Jan Kowalski',
    email: 'E-mail', emailPlaceholder: 'jan@firma.pl',
    category: 'Kategoria',
    message: 'Treść', messagePlaceholder: 'W czym możemy pomóc?',
    sendError: 'Nie udało się wysłać wiadomości.',
    sending: 'Wysyłanie…', send: 'Wyślij wiadomość',
    sentTitle: 'Wiadomość wysłana', sentBody: 'Odpowiemy najszybciej, jak to możliwe, na podany adres e-mail.',
  },
  en: {
    name: 'Name', namePlaceholder: 'Jane Smith',
    email: 'Email', emailPlaceholder: 'jane@company.com',
    category: 'Category',
    message: 'Message', messagePlaceholder: 'How can we help?',
    sendError: 'Could not send the message.',
    sending: 'Sending…', send: 'Send message',
    sentTitle: 'Message sent', sentBody: "We'll reply to the email address you provided as soon as we can.",
  },
}

export default function ContactForm({ lang = 'pl' }: { lang?: Locale }) {
  const t = STRINGS[lang]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot — left blank by real users
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useTrackedError('marketing_contact_form')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? t.sendError)
      setStatus('sent')
      setName(''); setEmail(''); setCategory(CATEGORIES[0].value); setMessage('')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-sent">
        <div className="contact-sent-icon">✓</div>
        <h3>{t.sentTitle}</h3>
        <p>{t.sentBody}</p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input
        type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
        autoComplete="off" tabIndex={-1} aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div className="contact-field">
        <label htmlFor="contact-name">{t.name}</label>
        <input id="contact-name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">{t.email}</label>
        <input id="contact-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-category">{t.category}</label>
        <select id="contact-category" required value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label[lang]}</option>)}
        </select>
      </div>
      <div className="contact-field">
        <label htmlFor="contact-message">{t.message}</label>
        <textarea id="contact-message" required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder={t.messagePlaceholder} />
      </div>

      {error && <div className="contact-error">{error}</div>}

      <button type="submit" className="btn btn--primary" disabled={status === 'sending'} style={{ width: '100%' }}>
        {status === 'sending' ? t.sending : t.send}
      </button>
    </form>
  )
}
