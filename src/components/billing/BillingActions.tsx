'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BillingActions({ hasPurchasablePlan }: { hasPurchasablePlan: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się otworzyć panelu rozliczeń.')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {hasPurchasablePlan && (
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', cursor: 'pointer' }}
        >
          {loading ? 'Otwieranie…' : 'Zarządzaj płatnościami'}
        </button>
      )}
      <Link href="/cennik" style={{ fontSize: 13, fontWeight: 500, color: '#16a34a', textDecoration: 'none' }}>
        {hasPurchasablePlan ? 'Zmień plan' : 'Wybierz plan'} →
      </Link>
      {error && <span style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</span>}
    </div>
  )
}
