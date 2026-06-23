'use client'

import { useState, useEffect } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Status = 'pass' | 'warn' | 'fail'

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
  chart: { labels: string[]; current: number[]; prev: number[] }
}

// ─── COLOR PALETTE (hardcoded hex — no CSS vars) ──────────────────────────────

const C = {
  bg:          '#1D2328',
  bgCard:      '#20272E',
  bgSection:   '#161B22',
  border:      '#2e3940',
  borderLight: '#374955',
  text:        '#e5e7eb',
  textMuted:   '#6B7280',
  textSub:     '#9ca3af',
  green:       '#4ade80',
  greenDim:    '#22543d',
  amber:       '#fbbf24',
  amberDim:    '#78350f',
  red:         '#f87171',
  redDim:      '#7f1d1d',
  barCurrent:  '#4ade80',
  barPrev:     '#374151',
  barBot:      '#f87171',
}

const STATUS_COLOR: Record<Status, string> = {
  pass: C.green,
  warn: C.amber,
  fail: C.red,
}
const STATUS_BG: Record<Status, string> = {
  pass: C.greenDim,
  warn: C.amberDim,
  fail: C.redDim,
}
const STATUS_LABEL: Record<Status, string> = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail',
}

// ─── SECTION METADATA ────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; accent: string }> = {
  traffic:    { label: 'Traffic Source',  accent: '#3b82f6' },
  engagement: { label: 'Engagement',      accent: '#8b5cf6' },
  users:      { label: 'Users',           accent: '#06b6d4' },
}

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────

function MiniBarChart({ chart, isBotIndex }: {
  chart: { labels: string[]; current: number[]; prev: number[] }
  isBotIndex?: boolean
}) {
  const { labels, current, prev } = chart
  const hasPrev = prev.length > 0

  if (labels.length === 0) return null

  const allVals  = [...current, ...(hasPrev ? prev : [])]
  const maxVal   = Math.max(...allVals, 0.01)

  // For bot index: show signal indicators instead of bars
  if (isBotIndex) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labels.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              backgroundColor: current[i] ? C.red : C.green,
            }} />
            <span style={{ fontSize: 10, color: current[i] ? C.red : C.textMuted }}>{label}</span>
          </div>
        ))}
      </div>
    )
  }

  const H  = 44           // chart height in px
  const BW = labels.length > 10 ? 4 : labels.length > 5 ? 6 : 8   // bar width
  const PG = 2            // gap between pair bars
  const PairW = hasPrev ? BW * 2 + PG : BW
  const GapBetween = labels.length > 10 ? 1 : 2
  const totalW = labels.length * PairW + (labels.length - 1) * GapBetween

  return (
    <svg
      viewBox={`0 0 ${totalW} ${H}`}
      width="100%" height={H}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {labels.map((label, i) => {
        const x       = i * (PairW + GapBetween)
        const currH   = Math.max((current[i] / maxVal) * H, current[i] > 0 ? 1 : 0)
        const prevH   = hasPrev ? Math.max((prev[i] / maxVal) * H, prev[i] > 0 ? 1 : 0) : 0

        return (
          <g key={i}>
            {hasPrev && (
              <rect
                x={x} y={H - prevH} width={BW} height={prevH}
                fill={C.barPrev} rx={1.5}
              />
            )}
            <rect
              x={hasPrev ? x + BW + PG : x}
              y={H - currH} width={BW} height={currH}
              fill={C.barCurrent} rx={1.5}
            />
          </g>
        )
      })}
    </svg>
  )
}

// ─── CHECK CARD ───────────────────────────────────────────────────────────────

function CheckCard({ check }: { check: CheckResult }) {
  const col    = STATUS_COLOR[check.status]
  const bgCol  = STATUS_BG[check.status]
  const isBotIndex = check.id === 'bot_suspicion'

  // Delta direction color
  const deltaPositive = check.deltaLabel.startsWith('+')
  // For (not set) and engagement floor, positive delta is bad
  const invertedChecks = ['not_set_share', 'unknown_country', 'bounce_rate']
  const deltaColor = check.deltaLabel === '—' || !check.deltaLabel.startsWith('+') && !check.deltaLabel.startsWith('-')
    ? C.textMuted
    : invertedChecks.includes(check.id)
      ? (deltaPositive ? C.red : C.green)
      : (deltaPositive ? C.green : C.red)

  return (
    <div style={{
      backgroundColor: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
            {check.label}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
            {check.description}
          </div>
        </div>
        {/* Status badge */}
        <div style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 8px', borderRadius: 20,
          backgroundColor: bgCol, color: col,
        }}>
          {STATUS_LABEL[check.status]}
        </div>
      </div>

      {/* Values row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: col, lineHeight: 1 }}>
            {check.valueLabel}
          </div>
          {check.prevLabel && (
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
              prev: {check.prevLabel}
            </div>
          )}
        </div>
        {check.deltaLabel && (
          <div style={{
            fontSize: 12, fontWeight: 600, color: deltaColor,
            padding: '2px 6px', borderRadius: 6,
            backgroundColor: '#ffffff0a',
          }}>
            {check.deltaLabel}
          </div>
        )}
        {check.detail && (
          <div style={{ fontSize: 10, color: C.textSub, flex: 1, textAlign: 'right' }}>
            {check.detail}
          </div>
        )}
      </div>

      {/* Mini chart */}
      {check.chart.labels.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {!isBotIndex && (
              <>
                {check.chart.prev.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: C.barPrev }} />
                    <span style={{ fontSize: 9, color: C.textMuted }}>Previous</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: C.barCurrent }} />
                  <span style={{ fontSize: 9, color: C.textMuted }}>Current</span>
                </div>
              </>
            )}
          </div>
          <MiniBarChart chart={check.chart} isBotIndex={isBotIndex} />
        </div>
      )}
    </div>
  )
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────

function Section({ sectionId, checks }: { sectionId: string; checks: CheckResult[] }) {
  const meta   = SECTION_META[sectionId]
  const passes = checks.filter(c => c.status === 'pass').length
  const total  = checks.length

  const scoreColor = passes === total ? C.green : passes > total / 2 ? C.amber : C.red

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{meta.label}</span>
        </div>
        <span style={{ fontSize: 11, color: scoreColor, fontWeight: 600 }}>
          {passes}/{total} checks passed
        </span>
      </div>

      {/* Check cards grid */}
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

// ─── LOADING / ERROR STATES ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
        border: `2px solid ${C.border}`, borderTopColor: C.green,
        animation: 'ga4spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes ga4spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 10 }}>
        Fetching data from GA4…
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '16px', borderRadius: 10, marginBottom: 16,
      backgroundColor: '#7f1d1d22', border: '1px solid #7f1d1d',
    }}>
      <div style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>GA4 connection error</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{message}</div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface LiveChecksPanelProps {
  propertyId: string
  period: number
}

const SECTIONS: Array<'traffic' | 'engagement' | 'users'> = ['traffic', 'engagement', 'users']

export default function LiveChecksPanel({ propertyId, period }: LiveChecksPanelProps) {
  const [checks, setChecks]       = useState<CheckResult[] | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

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

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />
  if (!checks) return null

  return (
    <div>
      {SECTIONS.map(s => (
        <Section
          key={s}
          sectionId={s}
          checks={checks.filter(c => c.section === s)}
        />
      ))}
    </div>
  )
}
