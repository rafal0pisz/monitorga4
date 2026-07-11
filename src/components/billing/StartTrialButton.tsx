'use client'

import { useState } from 'react'

export default function StartTrialButton({
  label, lang = 'en', style,
}: {
  label: string
  lang?: 'en' | 'pl'
  style?: React.CSSProperties
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? (lang === 'pl' ? 'Nie udało się uruchomić okresu próbnego.' : 'Could not start the trial.'))
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer', ...style }}
      >
        {loading ? (lang === 'pl' ? 'Uruchamianie…' : 'Starting…') : label}
      </button>
      {error && <p style={{ fontSize: 12.5, color: '#dc2626', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}
