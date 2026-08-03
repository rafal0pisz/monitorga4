import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AccountMismatch from '@/components/project/AccountMismatch'

const HISTORY_RUNS = 30

interface HistoryEntry {
  date: string
  eventName: string
  kind: 'disappeared' | 'increase'
  detail: string
}

// +50% is the same relative-change threshold the worker itself already
// uses to flag a volume "drop" for custom events/ecommerce (just mirrored
// for the increase direction) — keeps this view consistent with what the
// daily checks already consider a meaningful swing, not a new arbitrary cutoff.
const INCREASE_THRESHOLD = 50

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

  const { data: results } = runIds.length > 0
    ? await supabase
        .from('dqs_results')
        .select('run_id, check_key, value')
        .in('run_id', runIds)
        .or('check_key.eq.expected_events,check_key.eq.ecommerce_events,check_key.like.custom_event_*')
    : { data: [] }

  const entries: HistoryEntry[] = []

  for (const row of results ?? []) {
    const date = runDateById.get(row.run_id)
    if (!date) continue
    const v = (row.value ?? {}) as Record<string, any>

    if (row.check_key === 'expected_events') {
      for (const ev of v.missing ?? []) {
        entries.push({ date, eventName: ev, kind: 'disappeared', detail: 'Missing from expected events' })
      }
      continue
    }

    if (typeof row.check_key === 'string' && row.check_key.startsWith('custom_event_')) {
      const eventName = row.check_key.slice('custom_event_'.length)
      const current = v.current ?? 0
      const prev = v.prev ?? 0
      const delta = v.delta ?? 0
      if (current === 0 && prev > 0) {
        entries.push({ date, eventName, kind: 'disappeared', detail: `0 events (was ${prev.toLocaleString('en')})` })
      } else if (prev > 0 && delta >= INCREASE_THRESHOLD) {
        entries.push({ date, eventName, kind: 'increase', detail: `+${delta.toFixed(1)}% (${prev.toLocaleString('en')} → ${current.toLocaleString('en')})` })
      }
      continue
    }

    if (row.check_key === 'ecommerce_events') {
      const current: Record<string, number> = v.current ?? {}
      const prev: Record<string, number> = v.prev ?? {}
      const configured: string[] = v.configured ?? []
      for (const ev of configured) {
        const c = current[ev] ?? 0
        const p = prev[ev] ?? 0
        if (c === 0 && p > 0) {
          entries.push({ date, eventName: ev, kind: 'disappeared', detail: `0 events (was ${p.toLocaleString('en')})` })
        } else if (p > 0) {
          const delta = ((c - p) / p) * 100
          if (delta >= INCREASE_THRESHOLD) {
            entries.push({ date, eventName: ev, kind: 'increase', detail: `+${delta.toFixed(1)}% (${p.toLocaleString('en')} → ${c.toLocaleString('en')})` })
          }
        }
      }
    }
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
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Events history</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
        Disappeared events and volume spikes (+{INCREASE_THRESHOLD}% or more) across the last {HISTORY_RUNS} daily checks.
      </p>

      {dates.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 10, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          No disappearances or volume spikes recorded in the last {HISTORY_RUNS} daily checks.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dates.map(date => (
            <div key={date}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{fmtDate(date)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byDate.get(date)!.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'var(--color-background-primary)', border: `0.5px solid ${e.kind === 'disappeared' ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: e.kind === 'disappeared' ? '#dc2626' : '#16a34a' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{e.eventName}</span>
                    <span style={{ fontSize: 11, color: e.kind === 'disappeared' ? '#dc2626' : '#16a34a', marginLeft: 'auto' }}>
                      {e.kind === 'disappeared' ? 'Disappeared' : 'Volume spike'} — {e.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
