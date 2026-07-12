'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'

interface CoverageResult {
  total_events: number
  events_with_value: number
  coverage: number
  top_values: { value: string; count: number }[]
}

interface ParameterData {
  event_name: string
  parameter_name: string
  ga4_dimension: string
  current: CoverageResult
  prev: CoverageResult
  delta_relative: number | null
  delta_absolute: number
  ranges: { current: { start: string; end: string }; prev: { start: string; end: string } }
}

function CoverageBar({ value, prev }: { value: number; prev: number }) {
  const pct = Math.round(value * 100)
  const prevPct = Math.round(prev * 100)
  const color = pct >= 95 ? '#16a34a' : pct >= 80 ? '#ca8a04' : '#dc2626'
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

function ParameterCard({ data }: { data: ParameterData }) {
  const { current, prev, delta_absolute, delta_relative, ranges } = data
  const pct = Math.round(current.coverage * 100)
  const prevPct = Math.round(prev.coverage * 100)
  const color = pct >= 95 ? '#16a34a' : pct >= 80 ? '#ca8a04' : '#dc2626'
  const deltaPositive = delta_absolute >= 0
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ background: 'var(--color-background-primary)', border: `0.5px solid ${pct < 80 ? '#fecaca' : 'var(--color-border-tertiary)'}`, borderRadius: 10, overflow: 'hidden' }}>
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
        <CoverageBar value={current.coverage} prev={prev.coverage} />

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
          {pct >= 95 && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}>✓ Excellent coverage</span>}
          {pct >= 80 && pct < 95 && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04', border: '0.5px solid #fef08a' }}>⚠ Coverage below 95%</span>}
          {pct < 80 && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '0.5px solid #fecaca' }}>✕ Low coverage — check implementation</span>}
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

interface Props {
  projectId: string
  parameterChecks: { event_name: string; parameter_name: string }[]
  periodDays: number
}

export default function ParameterCoveragePanel({ projectId, parameterChecks, periodDays }: Props) {
  const [data, setData] = useState<Record<string, ParameterData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    for (const pc of parameterChecks) {
      const key = `${pc.event_name}_${pc.parameter_name}`
      setLoading(prev => ({ ...prev, [key]: true }))

      const params = new URLSearchParams({
        projectId,
        event: pc.event_name,
        parameter: pc.parameter_name,
        periodDays: String(periodDays),
      })

      ga4Fetch(`/api/ga4/parameters?${params}`)
        .then(res => res.json())
        .then(json => {
          if (json.error) throw new Error(json.error)
          setData(prev => ({ ...prev, [key]: json }))
        })
        .catch(err => setErrors(prev => ({ ...prev, [key]: err.message })))
        .finally(() => setLoading(prev => ({ ...prev, [key]: false })))
    }
  }, [projectId, JSON.stringify(parameterChecks), periodDays])

  if (parameterChecks.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {parameterChecks.map(pc => {
        const key = `${pc.event_name}_${pc.parameter_name}`
        const isLoading = loading[key]
        const error = errors[key]
        const result = data[key]

        return (
          <div key={key}>
            {isLoading && (
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Analyzing <span style={{ fontFamily: 'var(--font-mono)' }}>{pc.event_name} › {pc.parameter_name}</span>…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {error && (
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#92400e', margin: '0 0 6px', fontFamily: 'monospace' }}>
                  {pc.event_name} › {pc.parameter_name}
                </p>
                <p style={{ fontSize: 11, color: '#ca8a04', margin: '0 0 6px' }}>
                  GA4 dimension queried: <code style={{ background: '#fef9c3', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>customEvent:{pc.parameter_name}</code>
                </p>
                {(error.includes('400') || error.includes('INVALID') || error.includes('not found') || error.includes('Unknown')) ? (
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                    This dimension is not registered in GA4. Go to <strong>GA4 Admin → Custom definitions → Create custom dimension</strong>, scope: Event, parameter name: <code style={{ background: '#fef9c3', padding: '1px 5px', borderRadius: 3 }}>{pc.parameter_name}</code>
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: '#ca8a04', margin: 0 }}>{error}</p>
                )}
              </div>
            )}
            {result && !isLoading && <ParameterCard data={result} />}
          </div>
        )
      })}
    </div>
  )
}
