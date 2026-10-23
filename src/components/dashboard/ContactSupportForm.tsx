'use client'

import { useState } from 'react'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

// Values sent to /api/contact must match CATEGORIES in that route exactly
// (shared with the public Polish contact form) — only the labels shown
// here are translated, since everything behind login must be English.
const CATEGORIES = [
  { value: 'Wsparcie z obsługi', label: 'Account support' },
  { value: 'Chęć przetestowania aplikacji', label: 'Interested in a trial' },
  { value: 'Błąd w aplikacji', label: 'Bug report' },
  { value: 'Inne', label: 'Other' },
]

const inp: React.CSSProperties = { fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', width: '100%', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }

export default function ContactSupportForm({ defaultEmail }: { defaultEmail?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot — left blank by real users
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useTrackedError('dashboard_contact_support')

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
      if (!res.ok) throw new Error('Could not send your message — please try again.')
      setStatus('sent')
      setName(''); setCategory(CATEGORIES[0].value); setMessage('')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#166534', margin: '0 0 4px' }}>Message sent</p>
        <p style={{ fontSize: 12.5, color: '#166534', margin: 0 }}>We&apos;ll reply to the email address you provided as soon as we can.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
      <input
        type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
        autoComplete="off" tabIndex={-1} aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={lbl} htmlFor="cs-name">Name</label>
          <input id="cs-name" type="text" required value={name} onChange={e => setName(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl} htmlFor="cs-email">Email</label>
          <input id="cs-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl} htmlFor="cs-category">Category</label>
        <select id="cs-category" required value={category} onChange={e => setCategory(e.target.value)} style={inp}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl} htmlFor="cs-message">Message</label>
        <textarea id="cs-message" required rows={6} value={message} onChange={e => setMessage(e.target.value)} style={{ ...inp, resize: 'vertical' }} placeholder="How can we help?" />
      </div>
      {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>{error}</p>}
      <button type="submit" disabled={status === 'sending'} style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: status === 'sending' ? 'wait' : 'pointer' }}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
