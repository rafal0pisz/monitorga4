import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AccountMismatch from '@/components/project/AccountMismatch'
import { checkLabel } from '@/lib/ga4/checkLabels'

const HISTORY_RUNS = 30

type Category = 'traffic' | 'engagement' | 'users' | 'ecommerce' | 'custom_events' | 'parameters'

const CATEGORY_LABEL: Record<Category, string> = {
  traffic: 'Traffic',
  engagement: 'Engagement',
  users: 'Users',
  ecommerce: 'Ecommerce',
  custom_events: 'Custom Events',
  parameters: 'Parameters',
}

const CATEGORY_ORDER: Category[] = ['traffic', 'engagement', 'users', 'ecommerce', 'custom_events', 'parameters']

// Mirrors how the app already groups these same check_keys elsewhere
// (live checks panel sections) — kept local to this page rather than a
// shared module since nothing else needs it anymore.
function categoryFor(checkKey: string): Category {
  if (checkKey.startsWith('custom_event_')) return 'custom_events'
  if (checkKey.startsWith('param_')) return 'parameters'
  if (checkKey === 'ecommerce_events' || checkKey === 'purchase_duplicates') return 'ecommerce'
  if (checkKey === 'self_referral' || checkKey === 'direct_traffic_spike') return 'traffic'
  if (checkKey === 'geo_anomaly' || checkKey === 'bot_traffic_night') return 'users'
  return 'engagement' // expected_events, bounce_rate_anomaly, conversion_rate, page_title_null
}

interface HistoryEntry {
  date: string
  label: string
  kind: 'warn' | 'fail'
  detail: string
  category: Category
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const supabase = createAdminClient()

  const { data: project } = await supabase.from('projects').select('id, name, owner_id').eq('id', id).single()
  if (!project) notFound()
  if (!bypass && project.owner_id !== authData!.user!.id) return <AccountMismatch />

  const { data: runs } = await supabase
    .from('dqs_runs')
    .select('id, run_date')
    .eq('project_id', id)
    .eq('status', 'completed')
    .order('run_date', { ascending: false })
    .limit(HISTORY_RUNS)

  const runList = (runs ?? []) as { id: string; run_date: string }[]
  const runDateById = new Map<string, string>(runList.map(r => [r.id, r.run_date]))
  const runIds = runList.map(r => r.id)

  // Every check the daily run computes carries its own status, already
  // thresholded by the worker (see app/api/worker/run/route.ts) — no need
  // to re-derive "is this a meaningful change" here per check type.
  // Anything that came back Warn or Fail on a given day is worth showing,
  // with the check's own message as the description of what happened.
  const { data: results } = runIds.length > 0
    ? await supabase
        .from('dqs_results')
        .select('run_id, check_key, message, status')
        .in('run_id', runIds)
        .in('status', ['warn', 'fail'])
    : { data: [] }

  const entries: HistoryEntry[] = []
  for (const row of results ?? []) {
    const date = runDateById.get(row.run_id)
    if (!date || (row.status !== 'warn' && row.status !== 'fail')) continue
    entries.push({
      date,
      label: checkLabel(row.check_key),
      kind: row.status,
      detail: row.message ?? '',
      category: categoryFor(row.check_key),
    })
  }

  entries.sort((a, b) => b.date.localeCompare(a.date))

  const byDate = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <Link href={`/project/${id}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{project.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>History</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Check history</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
        Every check that came back Warn or Fail across the last {HISTORY_RUNS} daily runs — traffic, engagement, users, ecommerce, custom events, and parameters — with what happened.
      </p>

      {dates.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 10, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          No Warn or Fail checks recorded in the last {HISTORY_RUNS} daily runs.
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
                      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary, var(--color-text-secondary))', marginBottom: 6 }}>
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
