import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DEMO_PROJECT_DETAIL } from '@/lib/demo/data'

// Static twin of app/project/[id]/history/page.tsx — same grouping and
// card look, fed the fixed `history` array on the demo project instead of
// querying dqs_results.
const CATEGORY_LABEL: Record<string, string> = {
  traffic: 'Traffic',
  engagement: 'Engagement',
  users: 'Users',
  ecommerce: 'Ecommerce',
  custom_events: 'Custom Events',
  parameters: 'Parameters',
}
const CATEGORY_ORDER = ['traffic', 'engagement', 'users', 'ecommerce', 'custom_events', 'parameters']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DemoProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = DEMO_PROJECT_DETAIL[id]
  if (!detail) return notFound()

  const entries = [...detail.history].sort((a, b) => b.date.localeCompare(a.date))
  const byDate = new Map<string, typeof entries>()
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/demo" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <Link href={`/demo/project/${id}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{detail.summary.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>History</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Check history</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
        Every check that came back Warn or Fail across the last 30 daily runs — traffic, engagement, users, ecommerce, custom events, and parameters — with what happened. Fixed example data for this demo.
      </p>

      {dates.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 10, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          No Warn or Fail checks recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dates.map(date => {
            const dayEntries = byDate.get(date)!
            const categories = CATEGORY_ORDER.filter(cat => dayEntries.some(e => e.category === cat))
            return (
              <div key={date}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{fmtDate(date)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {categories.map(cat => (
                    <div key={cat}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        {CATEGORY_LABEL[cat]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {dayEntries.filter(e => e.category === cat).map((e, i) => {
                          const color = e.kind === 'fail' ? '#dc2626' : '#ca8a04'
                          const borderColor = e.kind === 'fail' ? '#fecaca' : '#fde68a'
                          return (
                            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', background: 'var(--color-background-primary)', border: `0.5px solid ${borderColor}`, borderRadius: 10 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: color }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{e.label}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color }}>{e.kind}</span>
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{e.detail}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
