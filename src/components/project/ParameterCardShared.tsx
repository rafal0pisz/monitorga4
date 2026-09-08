'use client'

import { useState } from 'react'

// Shared with the demo dashboard (src/lib/demo) — see CheckCardShared.tsx
// for why: the live Parameters cards and the demo's static equivalents
// must render pixel-identical output. ParameterCard needs its own expand
// state, so this whole module is a client component (safe to import into a
// server component either way).
export interface CoverageResult {
  total_events: number
  events_with_value: number
  coverage: number
  top_values: { value: string; count: number }[]
}

export interface ParameterData {
  event_name: string
  parameter_name: string
  ga4_dimension: string
  current: CoverageResult
  prev: CoverageResult
  delta_relative: number | null
  delta_absolute: number
  ranges: { current: { start: string; end: string }; prev: { start: string; end: string } }
}

// Coupon usage is inherently partial — most purchases don't use one, so
// near-100% coverage was never a realistic bar for it. Unlike every other
// parameter here, this only checks the field is wired up at all (some
// non-trivial share of events actually carry a coupon value), not how
// many customers happened to use one.
export function coverageStyle(parameterName: string, pct: number): { color: string; bg: string; border: string; label: 'Pass' | 'Warn' | 'Check' } {
  if (parameterName === 'coupon') {
    return pct >= 1
      ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass' }
      : { color: '#ca8a04', bg: '#fefce8', border: '#fde68a', label: 'Warn' }
  }
  if (pct >= 95) return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass' }
  if (pct >= 80) return { color: '#ca8a04', bg: '#fefce8', border: '#fde68a', label: 'Warn' }
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Check' }
}

export function CoverageBar({ value, prev, color }: { value: number; prev: number; color: string }) {
  const pct = Math.round(value * 100)
  const prevPct = Math.round(prev * 100)
  return (
    <div>
      <div style={{ height: 6, background: 'var(--color-background-secondary)', borderRadius: 3, overflow: 'hidden', marginBottom: 3, position: 'relative' }}>
        {/* Prev bar (lighter, behind) */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${prevPct}%`, background: '#d1d5db', borderRadius: 3 }} />
        {/* Current bar (on top) */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 3, opacity: 0.85 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)' }}>
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// Matches StoredCheckCard's param-tile look (project page) — grid of
// compact cards with a status badge, coverage %/prev, and a progress bar —
// shown eagerly (live, Period-reactive) for every configured parameter.
// The fuller ParameterCard (date ranges, top values) sits behind the "Show
// parameter details" button below instead, reusing this same fetched data.
export function MiniParameterCard({ data }: { data: ParameterData }) {
  const { current, prev, delta_absolute } = data
  const pct = Math.round(current.coverage * 100)
  const prevPct = Math.round(prev.coverage * 100)
  const { color, bg, border, label } = coverageStyle(data.parameter_name, pct)
  const deltaPositive = delta_absolute >= 0
  return (
    <div className="page-check-card" style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{data.event_name}.{data.parameter_name}</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, color, backgroundColor: bg, border: `1px solid ${border}` }}>{label}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color }}>{pct}%</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>prev: {prevPct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, backgroundColor: 'var(--color-border-tertiary)' }}>
          <div style={{ height: '100%', borderRadius: 3, backgroundColor: color, width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
        {deltaPositive ? '▲' : '▼'} {Math.abs(delta_absolute).toFixed(1)}pp WoW
      </div>
    </div>
  )
}

export function ParameterCard({ data }: { data: ParameterData }) {
  const { current, prev, delta_absolute, ranges } = data
  const pct = Math.round(current.coverage * 100)
  const prevPct = Math.round(prev.coverage * 100)
  const { color, label } = coverageStyle(data.parameter_name, pct)
  const isCoupon = data.parameter_name === 'coupon'
  const deltaPositive = delta_absolute >= 0
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ background: 'var(--color-background-primary)', border: `0.5px solid ${label === 'Check' ? '#fecaca' : 'var(--color-border-tertiary)'}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: expanded ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{data.event_name}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>›</span>
              <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{data.parameter_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 500, color, lineHeight: 1 }}>{pct}%</span>
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', margin: 0 }}>coverage</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                  {current.events_with_value.toLocaleString('en')} / {current.total_events.toLocaleString('en')} events
                </p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: deltaPositive ? '#16a34a' : '#dc2626' }}>
              {deltaPositive ? '▲' : '▼'} {Math.abs(delta_absolute).toFixed(1)} pp WoW
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              prev: {prevPct}%
            </div>
          </div>
        </div>

        {/* Coverage bar */}
        <CoverageBar value={current.coverage} prev={prev.coverage} color={color} />

        {/* Period labels */}
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: color, opacity: 0.85 }} />
            Current ({ranges.current.start} – {ranges.current.end}): <strong style={{ color: 'var(--color-text-primary)' }}>{pct}%</strong>
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: '#d1d5db' }} />
            Prev ({ranges.prev.start} – {ranges.prev.end}): <strong style={{ color: 'var(--color-text-primary)' }}>{prevPct}%</strong>
          </span>
        </div>

        {/* Status badge */}
        <div style={{ marginTop: 8 }}>
          {isCoupon ? (
            label === 'Pass'
              ? <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}>✓ Coupon parameter is present</span>
              : <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04', border: '0.5px solid #fef08a' }}>⚠ No coupon usage detected — verify the coupon parameter is wired up</span>
          ) : (
            <>
              {label === 'Pass' && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}>✓ Excellent coverage</span>}
              {label === 'Warn' && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04', border: '0.5px solid #fef08a' }}>⚠ Coverage below 95%</span>}
              {label === 'Check' && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '0.5px solid #fecaca' }}>✕ Low coverage — check implementation</span>}
            </>
          )}
        </div>
      </div>

      {/* Top values toggle */}
      {current.top_values.length > 0 && (
        <div>
          <button type="button" onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{expanded ? '▾' : '▸'}</span>
            <span>Top values in current period</span>
          </button>
          {expanded && (
            <div style={{ padding: '0 16px 12px' }}>
              {current.top_values.map((v, i) => {
                const pctOfTotal = current.total_events > 0 ? (v.count / current.total_events) * 100 : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, flex: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pctOfTotal}%`, background: '#16a34a', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{v.value}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{pctOfTotal.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
