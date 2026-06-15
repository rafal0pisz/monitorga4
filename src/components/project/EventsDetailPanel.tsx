'use client'
import { useState, useEffect } from 'react'

interface DayCount { date: string; count: number }
interface EventData { current: DayCount[]; prev: DayCount[]; totalCurrent: number; totalPrev: number }

function MiniBarChart({ current, prev }: { current: DayCount[]; prev: DayCount[] }) {
  const maxCount = Math.max(...current.map(d => d.count), ...prev.map(d => d.count), 1)
  const days = Math.max(current.length, prev.length, 7)
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36 }}>
      {Array.from({ length: days }).map((_, i) => {
        const c = current[i]?.count ?? 0; const p = prev[i]?.count ?? 0
        const cH = Math.round((c / maxCount) * 36); const pH = Math.round((p / maxCount) * 36)
        return (
          <div key={i} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1, height: pH || 1, background: '#d1d5db', borderRadius: '2px 2px 0 0', minWidth: 3 }} />
            <div style={{ flex: 1, height: cH || 1, background: c > 0 ? '#16a34a' : '#f3f4f6', borderRadius: '2px 2px 0 0', minWidth: 3 }} />
          </div>
        )
      })}
    </div>
  )
}

function EventCard({ name, data }: { name: string; data: EventData }) {
  const { totalCurrent, totalPrev, current, prev } = data
  const delta = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : null
  const isPresent = totalCurrent > 0
  return (
    <div style={{ padding: '12px 14px', borderRadius: 8, background: isPresent ? 'var(--color-background-secondary)' : '#fef2f2', border: `0.5px solid ${isPresent ? 'var(--color-border-tertiary)' : '#fecaca'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isPresent ? '#16a34a' : '#dc2626' }} />
            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)', color: isPresent ? 'var(--color-text-primary)' : '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
          {!isPresent && <span style={{ fontSize: 11, color: '#dc2626' }}>Not found in GA4</span>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: isPresent ? 'var(--color-text-primary)' : '#9ca3af', lineHeight: 1 }}>{totalCurrent.toLocaleString('en')}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>events</div>
        </div>
      </div>
      <MiniBarChart current={current} prev={prev} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: '#16a34a' }} />Current: {totalCurrent.toLocaleString('en')}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: '#d1d5db' }} />Prev: {totalPrev.toLocaleString('en')}
          </span>
        </div>
        {delta !== null && <span style={{ fontSize: 11, fontWeight: 500, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span>}
      </div>
    </div>
  )
}

export default function EventsDetailPanel({ propertyId, expectedEvents, periodDays }: { propertyId: string; expectedEvents: string[]; periodDays: number }) {
  const [data, setData] = useState<Record<string, EventData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ranges, setRanges] = useState<{ current: any; prev: any } | null>(null)

  useEffect(() => {
    if (!expectedEvents.length) { setLoading(false); return }
    async function load() {
      setLoading(true); setError(null)
      try {
        const params = new URLSearchParams({ propertyId, events: expectedEvents.join(','), periodDays: String(periodDays) })
        const res = await fetch(`/api/ga4/events?${params}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData(json.events); setRanges(json.ranges)
      } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }
    load()
  }, [propertyId, expectedEvents.join(','), periodDays])

  if (!expectedEvents.length) return null
  return (
    <div style={{ marginTop: 10 }}>
      {ranges && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#16a34a' }} />{ranges.current.start} – {ranges.current.end}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#d1d5db' }} />{ranges.prev.start} – {ranges.prev.end}
          </span>
        </div>
      )}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Loading event data…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <p style={{ fontSize: 12, color: '#ca8a04', margin: 0 }}>Could not load charts: {error}</p>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {expectedEvents.map(ev => <EventCard key={ev} name={ev} data={data[ev] ?? { current: [], prev: [], totalCurrent: 0, totalPrev: 0 }} />)}
        </div>
      ) : null}
    </div>
  )
}
