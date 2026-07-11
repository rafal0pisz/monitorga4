'use client'

import { useState } from 'react'

export default function BillingActions({ hasPurchasablePlan }: { hasPurchasablePlan: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not open the billing portal.')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!hasPurchasablePlan) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', cursor: 'pointer' }}
      >
        {loading ? 'Opening…' : 'Manage billing'}
      </button>
      {error && <span style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</span>}
    </div>
  )
}
