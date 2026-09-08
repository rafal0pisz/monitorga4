'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'
import { type CheckResult, SectionBlock } from './CheckCardShared'

export type { CheckResult }

function Loading() {
  return (
    <div style={{ padding: '28px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
        border: '2px solid var(--color-border-tertiary)', borderTopColor: '#16a34a',
        animation: 'lcSpin 0.8s linear infinite',
      }} />
      <style>{`@keyframes lcSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Fetching GA4 data…
      </div>
    </div>
  )
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>GA4 connection error</div>
      <div style={{ fontSize: 11, color: '#991b1b', marginTop: 3 }}>{message}</div>
    </div>
  )
}

interface Props { projectId: string; period: number; anchorOffset?: number; extraChecks?: CheckResult[] }

const LCStyle = () => (
  <style>{`
    @media (max-width: 600px) {
      .lc-grid { grid-template-columns: 1fr !important; }
      .lc-nav  { flex-wrap: wrap; gap: 8px !important; }
      .lc-card { padding: 12px 12px !important; }
    }
  `}</style>
)
// lcResponsive

export default function LiveChecksPanel({ projectId, period, anchorOffset = 0, extraChecks = [] }: Props) {
  const [checks,  setChecks]  = useState<CheckResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    ga4Fetch('/api/ga4/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, period, anchorOffset }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d.error) throw new Error(d.error)
        setChecks(d.checks)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, period, anchorOffset])

  // extraChecks (from the last daily run) render immediately — they don't
  // depend on the live GA4 fetch above, so a slow/failed live fetch
  // shouldn't hide them.
  const merged = [...(checks ?? []), ...extraChecks]
  const showSections = merged.length > 0

  return (
    <div>
      {loading && !showSections && <Loading />}
      {error && <ErrorBlock message={error} />}
      {showSections && (['traffic', 'engagement', 'users'] as const).map(s => (
        <SectionBlock key={s} id={s} checks={merged.filter(c => c.section === s)} />
      ))}
    </div>
  )
}
