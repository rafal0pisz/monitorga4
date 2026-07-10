'use client'

import { useState } from 'react'

const CATEGORIES = ['Wsparcie z obsługi', 'Chęć przetestowania aplikacji', 'Błąd w aplikacji', 'Inne']

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot — left blank by real users
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

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
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się wysłać wiadomości.')
      setStatus('sent')
      setName(''); setEmail(''); setCategory(CATEGORIES[0]); setMessage('')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-sent">
        <div className="contact-sent-icon">✓</div>
        <h3>Wiadomość wysłana</h3>
        <p>Odpowiemy najszybciej, jak to możliwe, na podany adres e-mail.</p>
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
        <label htmlFor="contact-name">Imię</label>
        <input id="contact-name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jan Kowalski" />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">E-mail</label>
        <input id="contact-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@firma.pl" />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-category">Kategoria</label>
        <select id="contact-category" required value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="contact-field">
        <label htmlFor="contact-message">Treść</label>
        <textarea id="contact-message" required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="W czym możemy pomóc?" />
      </div>

      {error && <div className="contact-error">{error}</div>}

      <button type="submit" className="btn btn--primary" disabled={status === 'sending'} style={{ width: '100%' }}>
        {status === 'sending' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>
    </form>
  )
}
