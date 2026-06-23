'use client'

import { useState, useEffect } from 'react'

type Status = 'pass' | 'warn' | 'check'

interface CheckResult {
  id: string
  section: 'traffic' | 'engagement' | 'users'
  label: string
  description: string
  status: Status
  valueLabel: string
  prevLabel: string
  deltaLabel: string
  detail?: string
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pass:  { label: 'Pass',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  warn:  { label: 'Warn',  color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  check: { label: 'Check', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────

const SECTION: Record<string, { label: string; accent: string }> = {
  traffic:    { label: 'Traffic Source',  accent: '#3b82f6' },
  engagement: { label: 'Engagement',      accent: '#8b5cf6' },
  users:      { label: 'Users',           accent: '#0891b2' },
}

// ─── CHECK CARD ───────────────────────────────────────────────────────────────

function CheckCard({ check }: { check: CheckResult }) {
  const st = STATUS[check.status]

  // Delta colour — for (not set)/unknown/bounce: positive change is bad
  const invertIds = ['not_set_share', 'unknown_country', 'bounce_rate']
  const isPositive = check.deltaLabel.startsWith('+')
  const deltaColor = !check.deltaLabel || check.deltaLabel === '—'
    ? 'var(--color-text-secondary)'
    : invertIds.includes(check.id)
      ? (isPositive ? '#dc2626' : '#16a34a')
      : (isPositive ? '#16a34a' : '#dc2626')

  return (
    <div style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3 }}>
            {check.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            {check.description}
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '3px 9px', borderRadius: 20,
          color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`,
        }}>
          {st.label}
        </div>
      </div>

      {/* Values row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Current value */}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: st.color, lineHeight: 1 }}>
            {check.valueLabel}
          </div>
          {check.prevLabel && (
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              prev: {check.prevLabel}
            </div>
          )}
        </div>

        {/* Delta */}
        {check.deltaLabel && check.deltaLabel !== '—' && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: deltaColor,
            padding: '2px 7px', borderRadius: 6,
            backgroundColor: deltaColor + '18',
            border: `1px solid ${deltaColor}30`,
          }}>
            {check.deltaLabel}
          </div>
        )}

        {/* Detail */}
        {check.detail && (
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', flex: 1, textAlign: 'right' }}>
            {check.detail}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SECTION BLOCK ────────────────────────────────────────────────────────────

function SectionBlock({ id, checks }: { id: string; checks: CheckResult[] }) {
  const meta    = SECTION[id]
  const passes  = checks.filter(c => c.status === 'pass').length
  const total   = checks.length
  const scoreColor = passes === total ? '#16a34a' : passes > total / 2 ? '#ca8a04' : '#dc2626'

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid var(--color-border-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {meta.label}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: scoreColor }}>
          {passes}/{total} passed
        </span>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 10,
      }}>
        {checks.map(c => <CheckCard key={c.id} check={c} />)}
      </div>
    </div>
  )
}

// ─── LOADING / ERROR ──────────────────────────────────────────────────────────

function Loading() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
        border: '2px solid var(--color-border-tertiary)', borderTopColor: '#16a34a',
        animation: 'lcSpin 0.8s linear infinite',
      }} />
      <style>{`@keyframes lcSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 10 }}>
        Fetching data from GA4…
      </div>
    </div>
  )
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>GA4 connection error</div>
      <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 4 }}>{message}</div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

interface Props { propertyId: string; period: number }

const SECTIONS = ['traffic', 'engagement', 'users'] as const

export default function LiveChecksPanel({ propertyId, period }: Props) {
  const [checks,  setChecks]  = useState<CheckResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    fetch('/api/ga4/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, period }),
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
  }, [propertyId, period])

  if (loading) return <Loading />
  if (error)   return <ErrorBlock message={error} />
  if (!checks) return null

  return (
    <div>
      {SECTIONS.map(s => (
        <SectionBlock
          key={s}
          id={s}
          checks={checks.filter(c => c.section === s)}
        />
      ))}
    </div>
  )
}
