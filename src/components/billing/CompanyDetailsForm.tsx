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
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się zapisać danych.')
      setStatus('saved')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (!hasCustomer) {
    return (
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Dane firmy będzie można ustawić po pierwszym zakupie planu.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
        Te dane trafiają na konto rozliczeniowe w Stripe i zostaną użyte na kolejnej wystawionej fakturze (np. przy odnowieniu subskrypcji). Już wystawionych faktur nie da się zmienić wstecz.
      </p>
      <div>
        <label style={labelStyle} htmlFor="cd-name">Nazwa firmy</label>
        <input id="cd-name" style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Twoja Firma Sp. z o.o." />
      </div>
      <div>
        <label style={labelStyle} htmlFor="cd-line1">Adres</label>
        <input id="cd-line1" style={fieldStyle} value={line1} onChange={e => setLine1(e.target.value)} placeholder="ul. Przykładowa 1" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="cd-postal">Kod pocztowy</label>
          <input id="cd-postal" style={fieldStyle} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00-000" />
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelStyle} htmlFor="cd-city">Miasto</label>
          <input id="cd-city" style={fieldStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Warszawa" />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor="cd-nip">NIP</label>
        <input id="cd-nip" style={fieldStyle} value={nip} onChange={e => setNip(e.target.value)} placeholder="1234567890" />
      </div>

      {error && <div className="contact-error" style={{ fontSize: 12.5 }}>{error}</div>}

      <button
        type="submit"
        disabled={status === 'saving'}
        style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer', width: 'fit-content' }}
      >
        {status === 'saving' ? 'Zapisywanie…' : status === 'saved' ? 'Zapisano ✓' : 'Zapisz dane firmy'}
      </button>
    </form>
  )
}
