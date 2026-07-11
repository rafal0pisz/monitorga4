'use client'

import { useState } from 'react'

interface Props {
  hasCustomer: boolean
  initialName: string
  initialLine1: string
  initialCity: string
  initialPostalCode: string
  initialNip: string
}

const fieldStyle: React.CSSProperties = {
  fontSize: 13, padding: '8px 10px', borderRadius: 8,
  border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }

export default function CompanyDetailsForm({ hasCustomer, initialName, initialLine1, initialCity, initialPostalCode, initialNip }: Props) {
  const [name, setName] = useState(initialName)
  const [line1, setLine1] = useState(initialLine1)
  const [city, setCity] = useState(initialCity)
  const [postalCode, setPostalCode] = useState(initialPostalCode)
  const [nip, setNip] = useState(initialNip)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setError(null)
    try {
      const res = await fetch('/api/stripe/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, line1, city, postalCode, nip }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not save your details.')
      setStatus('saved')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (!hasCustomer) {
    return (
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Company details can be set after your first plan purchase.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
        These details are saved to your Stripe billing account and used on the next invoice issued (e.g. a subscription renewal). Already-issued invoices can&apos;t be changed retroactively.
      </p>
      <div>
        <label style={labelStyle} htmlFor="cd-name">Company name</label>
        <input id="cd-name" style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your Company Sp. z o.o." />
      </div>
      <div>
        <label style={labelStyle} htmlFor="cd-line1">Address</label>
        <input id="cd-line1" style={fieldStyle} value={line1} onChange={e => setLine1(e.target.value)} placeholder="1 Example Street" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="cd-postal">Postal code</label>
          <input id="cd-postal" style={fieldStyle} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00-000" />
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelStyle} htmlFor="cd-city">City</label>
          <input id="cd-city" style={fieldStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Warsaw" />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor="cd-nip">Tax ID (NIP)</label>
        <input id="cd-nip" style={fieldStyle} value={nip} onChange={e => setNip(e.target.value)} placeholder="1234567890" />
      </div>

      {error && (
        <div style={{ fontSize: 12.5, color: '#c23b34', background: '#fdf2f1', border: '1px solid #f8d4d1', borderRadius: 8, padding: '8px 12px' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'saving'}
        style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer', width: 'fit-content' }}
      >
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save company details'}
      </button>
    </form>
  )
}
