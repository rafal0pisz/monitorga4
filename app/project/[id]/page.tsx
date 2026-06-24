import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector    from '@/components/project/PeriodSelector'
import RunNowButton      from '@/components/project/RunNowButton'
import LiveChecksPanel   from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import Link from 'next/link'

type RunRow = { id: string; run_date: string; score_total: number | null; status: string }

const SKIP_IDS = new Set([
  'expected_events','self_referral','direct_traffic_spike',
  'bounce_rate_anomaly','conversion_rate','page_title_null','session_no_events',
  'geo_anomaly','bot_traffic_night',
])

// Worker saves results with column check_key (not check_id)
function storedSection(checkKey: string | null | undefined): 'ecommerce'|'custom_events'|'parameters'|null {
  if (!checkKey) return null
  if (SKIP_IDS.has(checkKey)) return null
  if (['purchase_duplicates','ecommerce_events','ecommerce_presence'].includes(checkKey)) return 'ecommerce'
  if (checkKey.startsWith('ecom_')) return 'ecommerce'
  if (checkKey.startsWith('evt_')||checkKey.startsWith('event_')||checkKey.startsWith('custom_event')||checkKey.includes('_presence')) return 'custom_events'
  return 'parameters'
}

const SECTION_META = {
  ecommerce:     { label: 'Ecommerce',     accent: '#f97316' },
  custom_events: { label: 'Custom Events', accent: '#ca8a04' },
  parameters:    { label: 'Parameters',    accent: '#8b5cf6' },
} as const

type ST = { color: string; bg: string; border: string; label: string }
const STATUS: Record<string, ST> = {
  pass:  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass'  },
  warn:  { color: '#ca8a04', bg: '#fefce8', border: '#fde68a', label: 'Warn'  },
  check: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Check' },
  fail:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Check' },
  skip:  { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', label: 'Skip'  },
}
const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : '#dc2626'

export default async function ProjectPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id }     = await params
  const { period } = await searchParams
  const periodDays = Number(period) || 7

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const admin = createAdminClient()

  const { data: project } = await admin.from('projects').select('*').eq('id', id).single()
  if (!project) return notFound()

  const { data: runsRaw } = await admin
    .from('dqs_runs').select('id, run_date, score_total, status')
    .eq('project_id', id).order('run_date', { ascending: false }).limit(10)
  const runs = (runsRaw ?? []) as RunRow[]
  const latestRun = runs[0] ?? null

  const { data: storedResults } = latestRun
    ? await admin.from('dqs_results').select('*').eq('run_id', latestRun.id)
    : { data: [] }

  const { data: ecomRaw } = await admin.rpc('get_ecommerce_config', { p_project_id: id })
  const ecomArr = Array.isArray(ecomRaw) ? ecomRaw : []
  const ecomEvents: string[] = ecomArr.filter((e: any) => e.is_enabled !== false).map((e: any) => e.event_name as string)

  const bySection: Record<string, any[]> = { ecommerce: [], custom_events: [], parameters: [] }
  for (const r of storedResults ?? []) {
    try {
      // Worker uses check_key column
      const s = storedSection(r.check_key)
      if (s) bySection[s].push(r)
    } catch { /* skip malformed rows */ }
  }

  const expectedEvents: string[] = Array.isArray(project.expected_events) ? project.expected_events : []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)' }}>
      <nav style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
            <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{project.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Suspense fallback={<div style={{ width: 200, height: 24 }} />}>
              <PeriodSelector current={periodDays} />
            </Suspense>
            <Link href={`/project/${id}/config`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              ⚙ Settings
            </Link>
            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Score header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 28, backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>GA4 Property</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{project.ga4_property_id || '—'}</div>
            {latestRun
              ? <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Last run: {latestRun.run_date}{latestRun.status === 'failed' && <span style={{ color: '#dc2626', marginLeft: 8 }}>· Failed</span>}</div>
              : <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>No runs yet — click <strong>Run now</strong> to start.</div>}
          </div>
          {latestRun?.score_total != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Overall Score</div>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: scoreColor(latestRun.score_total) }}>{Math.round(latestRun.score_total)}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>/100</div>
            </div>
          )}
        </div>

        {/* Score history */}
        {runs.length > 1 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--color-border-tertiary)' }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#6366f1' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Score History</span>
            </div>
            <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-secondary)' }}>
                    {['Date','Score','Status','vs prev'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run: RunRow, i: number) => {
                    const prev: RunRow | undefined = runs[i + 1]
                    const delta = prev?.score_total != null && run.score_total != null ? Math.round(run.score_total - prev.score_total) : null
                    const col = run.score_total != null ? scoreColor(run.score_total) : '#9ca3af'
                    return (
                      <tr key={run.id} style={{ borderBottom: i < runs.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none' }}>
                        <td style={{ padding: '8px 16px' }}>{run.run_date}{i === 0 && <span style={{ marginLeft: 6, fontSize: 9, color: '#16a34a', fontWeight: 700 }}>LATEST</span>}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color: col }}>{run.score_total != null ? Math.round(run.score_total) : '—'}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: 11, color: run.status === 'failed' ? '#dc2626' : '#16a34a' }}>{run.status === 'failed' ? 'Failed' : 'OK'}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: 11 }}>{delta != null ? <span style={{ color: delta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{delta >= 0 ? '+' : ''}{delta}</span> : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live checks: Traffic / Engagement / Users */}
        {project.ga4_property_id
          ? <LiveChecksPanel propertyId={project.ga4_property_id} period={periodDays} />
          : <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 24, backgroundColor: '#fefce8', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>No GA4 property configured. <Link href={`/project/${id}/config`} style={{ color: '#16a34a' }}>Open Settings →</Link></div>
        }

        {/* Stored checks: Ecommerce / Custom Events / Parameters */}
        {(['ecommerce', 'custom_events', 'parameters'] as const).map(sectionId => {
          const meta   = SECTION_META[sectionId]
          const checks = bySection[sectionId]
          const emptyMsg = {
            ecommerce:     'No ecommerce checks — configure in project settings.',
            custom_events: 'No custom events configured — add expected events in settings.',
            parameters:    'No parameter checks configured — set up in project settings.',
          }[sectionId]
          return (
            <div key={sectionId} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{meta.label}</span>
                </div>
                {checks.length > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{checks.filter((c: any) => c.status === 'pass').length}/{checks.length} passed</span>}
              </div>
              {checks.length === 0
                ? <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{emptyMsg}</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {checks.map((c: any) => <StoredCheckCard key={c.check_key ?? c.id} check={c} />)}
                  </div>
              }
              {sectionId === 'custom_events' && expectedEvents.length > 0 && project.ga4_property_id && (
                <div style={{ marginTop: 14 }}>
                  <EventsDetailPanel propertyId={project.ga4_property_id} expectedEvents={expectedEvents} periodDays={periodDays} />
                </div>
              )}
              {sectionId === 'ecommerce' && ecomEvents.length > 0 && project.ga4_property_id && (
                <div style={{ marginTop: 14 }}>
                  <EventsDetailPanel propertyId={project.ga4_property_id} expectedEvents={ecomEvents} periodDays={periodDays} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StoredCheckCard({ check }: { check: any }) {
  const st = STATUS[check.status ?? 'skip'] ?? STATUS.skip
  const label = check.check_key ?? check.check_id ?? '—'
  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
      </div>
      {typeof check.value === "number" && <div style={{ fontSize: 20, fontWeight: 700, color: st.color, marginTop: 6 }}>{check.value.toFixed(1)}</div>}
      {check.message && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 5 }}>{check.message}</div>}
    </div>
  )
}
