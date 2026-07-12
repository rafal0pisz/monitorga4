'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'

type Status = 'pass' | 'warn' | 'check'

export interface CheckResult {
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

const STATUS: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pass:  { label: 'Pass',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  warn:  { label: 'Warn',  color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
  check: { label: 'Check', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const SECTION: Record<string, { label: string; accent: string }> = {
  traffic:    { label: 'Traffic Source',  accent: '#3b82f6' },
  engagement: { label: 'Engagement',      accent: '#8b5cf6' },
  users:      { label: 'Users',           accent: '#0891b2' },
}

function CheckCard({ check }: { check: CheckResult }) {
  const st = STATUS[check.status]

  // Invert delta colour for metrics where higher = worse
  const invertIds = ['not_set_share', 'unknown_country', 'bounce_rate']
  const isPositive = check.deltaLabel.startsWith('+')
  const deltaColor = !check.deltaLabel || ['—', 'All clear'].includes(check.deltaLabel)
    ? 'var(--color-text-secondary)'
    : invertIds.includes(check.id)
      ? (isPositive ? '#dc2626' : '#16a34a')
      : (isPositive ? '#16a34a' : '#dc2626')

  return (
    <div className="lc-card" style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      {/* Label + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {check.label}
        </span>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 9px', borderRadius: 20,
          color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`,
        }}>
          {st.label}
        </span>
      </div>

      {/* Description — short, gray, small */}
      <p style={{
        margin: '0 0 10px',
        fontSize: 11, lineHeight: 1.5,
        color: 'var(--color-text-secondary)',
      }}>
        {check.description}
      </p>

      {/* Values */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: st.color, lineHeight: 1 }}>
            {check.valueLabel}
          </span>
          {check.prevLabel && (
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
              prev: {check.prevLabel}
            </span>
          )}
        </div>

        {check.deltaLabel && !['—'].includes(check.deltaLabel) && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: deltaColor,
            padding: '2px 7px', borderRadius: 6,
            backgroundColor: deltaColor + '15',
          }}>
            {check.deltaLabel}
          </span>
        )}

        {check.detail && (
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
            {check.detail}
          </span>
        )}
      </div>
    </div>
  )
}

function SectionBlock({ id, checks }: { id: string; checks: CheckResult[] }) {
  const meta   = SECTION[id]
  const passes = checks.filter(c => c.status === 'pass').length
  const total  = checks.length
  const scoreColor = passes === total ? '#16a34a' : passes > total / 2 ? '#ca8a04' : '#dc2626'

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid var(--color-border-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {meta.label}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: scoreColor }}>
          {passes}/{total} passed
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: 10,
      }}>
        {checks.map(c => <CheckCard key={c.id} check={c} />)}
      </div>
    </div>
  )
}

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

interface Props { projectId: string; period: number; extraChecks?: CheckResult[] }

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

export default function LiveChecksPanel({ projectId, period, extraChecks = [] }: Props) {
  const [checks,  setChecks]  = useState<CheckResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    ga4Fetch('/api/ga4/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, period }),
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
  }, [projectId, period])

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
