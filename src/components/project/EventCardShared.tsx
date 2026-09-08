// Shared with the demo dashboard (src/lib/demo) — see CheckCardShared.tsx
// for why: the live Ecommerce/Custom Events cards and the demo's static
// equivalents must render pixel-identical output.
export interface DayCount { date: string; count: number }
export interface EventData { current: DayCount[]; prev: DayCount[]; totalCurrent: number; totalPrev: number }

// GA4's date dimension is a bare YYYYMMDD string — this doesn't assume the
// API returns rows in a particular order (it wasn't oldest-first, which is
// why the newest day was rendering on the left instead of the right, unlike
// ScoreTrendChart's explicit oldest→newest sort).
function sortAscending(days: DayCount[]): DayCount[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date))
}

function fmtGA4Date(d: string) {
  const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function MiniBarChart({ current, prev }: { current: DayCount[]; prev: DayCount[] }) {
  // Used to force a minimum of 7 slots regardless of how much data actually
  // existed — harmless when periodDays was always ≥7, but with Period: 1d
  // selected, current/prev each hold exactly one day, so it padded out 6
  // empty slots next to the one real bar, stranding the date label (always
  // right-aligned) far away from it and making the chart look broken.
  const days = Math.min(Math.max(current.length, prev.length, 1), 14)
  // Sort oldest→newest first, then keep only the most recent `days` entries
  // — otherwise slicing before sorting could keep the OLDEST days instead
  // of the most recent ones whenever there's more history than `days`.
  const sortedCurrent = sortAscending(current).slice(-days)
  const sortedPrev = sortAscending(prev).slice(-days)
  const maxCount = Math.max(...sortedCurrent.map(d => d.count), ...sortedPrev.map(d => d.count), 1)
  const latestDate = sortedCurrent[sortedCurrent.length - 1]?.date

  if (days === 1) {
    // Single day (Period: 1d) — a full-width row would stretch one bar
    // pair across the whole card; show it compact and centered instead,
    // with the date directly underneath rather than floated to the right.
    const c = sortedCurrent[0]?.count ?? 0
    const p = sortedPrev[0]?.count ?? 0
    const cH = Math.round((c / maxCount) * 36)
    const pH = Math.round((p / maxCount) * 36)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 36 }}>
          <div style={{ width: 14, height: pH || 1, background: '#d1d5db', borderRadius: '2px 2px 0 0' }} />
          <div style={{ width: 14, height: cH || 1, background: c > 0 ? '#16a34a' : '#f3f4f6', borderRadius: '2px 2px 0 0' }} />
        </div>
        {latestDate && (
          <div style={{ fontSize: 8, color: 'var(--color-text-secondary)' }}>
            {fmtGA4Date(latestDate)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36 }}>
        {Array.from({ length: days }).map((_, i) => {
          const c = sortedCurrent[i]?.count ?? 0; const p = sortedPrev[i]?.count ?? 0
          const cH = Math.round((c / maxCount) * 36); const pH = Math.round((p / maxCount) * 36)
          return (
            <div key={i} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', flex: 1 }}>
              <div style={{ flex: 1, height: pH || 1, background: '#d1d5db', borderRadius: '2px 2px 0 0', minWidth: 3 }} />
              <div style={{ flex: 1, height: cH || 1, background: c > 0 ? '#16a34a' : '#f3f4f6', borderRadius: '2px 2px 0 0', minWidth: 3 }} />
            </div>
          )
        })}
      </div>
      {latestDate && (
        <div style={{ textAlign: 'right', fontSize: 8, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          {fmtGA4Date(latestDate)}
        </div>
      )}
    </div>
  )
}

export function EventCard({ name, data }: { name: string; data: EventData }) {
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
