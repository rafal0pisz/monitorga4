'use client'
import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'
import { type EventData, EventCard } from './EventCardShared'

export type { EventData }

export default function EventsDetailPanel({ projectId, expectedEvents, periodDays, anchorOffset = 0 }: { projectId: string; expectedEvents: string[]; periodDays: number; anchorOffset?: number }) {
  const [data, setData] = useState<Record<string, EventData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [ranges, setRanges] = useState<{ current: any; prev: any } | null>(null)

  useEffect(() => {
    if (!expectedEvents.length) { setLoading(false); return }
    async function load() {
      setLoading(true); setError(null); setBlocked(false)
      try {
        const params = new URLSearchParams({ projectId, events: expectedEvents.join(','), periodDays: String(periodDays), anchorOffset: String(anchorOffset) })
        const res = await ga4Fetch(`/api/ga4/events?${params}`)
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 402) { setBlocked(true); setError(json.error); return }
          throw new Error(json.error)
        }
        setData(json.events); setRanges(json.ranges)
      } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }
    load()
  }, [projectId, expectedEvents.join(','), periodDays, anchorOffset])

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
      ) : blocked ? (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#92400e' }}>{error}</span>
          <a href="/cennik" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</a>
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
