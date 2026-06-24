import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector    from '@/components/project/PeriodSelector'
import RunNowButton      from '@/components/project/RunNowButton'
import LiveChecksPanel   from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import Link from 'next/link'
import PDFExportButton from '@/components/project/PDFExportButton'

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
  if (checkKey === 'custom_events_check') return 'custom_events'
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


// pageResponsive
function PageStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .page-nav-actions { flex-wrap: wrap; gap: 6px !important; }
        .page-score-header { flex-direction: column !important; }
        .page-grid { grid-template-columns: 1fr !important; }
        .page-history-table { font-size: 11px !important; }
        .page-settings-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .page-period-label { display: none !important; }
      }
    `}</style>
  )
}

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
      <PageStyles />
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
            <PDFExportButton projectName={project.name} />
            <Link href={`/project/${id}/config`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              ⚙ Settings
            </Link>
            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Score header */}
        <div className="page-score-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 28, backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, gap: 20 }}>
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

        {/* Score sparkline */}
        {runs.length > 1 && <ScoreSparkline runs={runs} />}

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
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{meta.label}</span>
                </div>
                {checks.length > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{checks.filter((c: any) => c.status === 'pass').length}/{checks.length} passed</span>}
              </div>
              {checks.length === 0
                ? <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{emptyMsg}</div>
                : <div className="page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 10 }}>
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


function ScoreSparkline({ runs }: { runs: RunRow[] }) {
  const filtered = runs.filter(r => r.score_total != null).reverse() // oldest → newest
  const pts   = filtered.map(r => r.score_total!)
  const dates = filtered.map(r => {
    const d = new Date(r.run_date)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  })

  if (pts.length < 2) return null

  const W = 160, H = 36, pad = 4, dateH = 12
  const toX = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2)
  const toY = (v: number) => H - pad - (v / 100) * (H - pad * 2)

  const polyline = pts.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const latestScore = pts[pts.length - 1]
  const col = latestScore >= 80 ? '#16a34a' : latestScore >= 60 ? '#ca8a04' : '#dc2626'
  const areaPath = [
    `M ${toX(0)},${H - pad}`,
    ...pts.map((v, i) => `L ${toX(i)},${toY(v)}`),
    `L ${toX(pts.length - 1)},${H - pad}`, 'Z',
  ].join(' ')

  const latestRun = runs[0]
  const delta = runs.length > 1 && runs[0].score_total != null && runs[1].score_total != null
    ? Math.round(runs[0].score_total - runs[1].score_total) : null

  return (
    <div style={{
      padding: '10px 16px 8px', marginBottom: 16,
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Score trend · {pts.length} runs
        </div>
        {delta != null && (
          <div style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
            {delta >= 0 ? '+' : ''}{delta} vs prev
          </div>
        )}
      </div>

      {/* Chart */}
      <svg width={W} height={H + dateH} viewBox={`0 0 ${W} ${H + dateH}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Area fill */}
        <path d={areaPath} fill={col} fillOpacity={0.1} />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots + score labels */}
        {pts.map((v, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r={i === pts.length - 1 ? 3 : 2} fill={col} />
            {(i === 0 || i === pts.length - 1) && (
              <text
                x={toX(i)} y={toY(v) - 5}
                fontSize={8} fill={col} textAnchor="middle"
                fontWeight={i === pts.length - 1 ? '700' : '400'}
              >{Math.round(v)}</text>
            )}
          </g>
        ))}
        {/* Date labels on x-axis */}
        {pts.map((_, i) => {
          // Show all dates if ≤7 runs, otherwise only first and last
          const showLabel = pts.length <= 7 || i === 0 || i === pts.length - 1
          if (!showLabel) return null
          return (
            <text
              key={`d${i}`}
              x={toX(i)} y={H + dateH - 2}
              fontSize={7} fill="var(--color-text-secondary)"
              textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}
            >{dates[i]}</text>
          )
        })}
        {/* Baseline */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--color-border-tertiary)" strokeWidth={0.5} />
      </svg>
    </div>
  )
}

function StoredCheckCard({ check }: { check: any }) {
  const st    = STATUS[check.status ?? 'skip'] ?? STATUS.skip
  const label = check.check_key ?? check.check_id ?? '—'
  const isParam  = typeof label === 'string' && label.startsWith('param_')
  const isCount  = typeof label === 'string' && (label.startsWith('ecom_') || label.startsWith('custom_event_'))
  const val      = check.value && typeof check.value === 'object' ? check.value : null
  const covCurr  = isParam  && val ? (val.coverage_current ?? null) : null
  const covPrev  = isParam  && val ? (val.coverage_prev   ?? null) : null
  const cntCurr  = isCount  && val ? (val.current ?? null) : null
  const cntPrev  = isCount  && val ? (val.prev    ?? null) : null

  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
      </div>

      {/* Parameter — progress bar */}
      {isParam && covCurr != null && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: st.color }}>{covCurr.toFixed(1)}%</span>
            {covPrev != null && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>prev: {covPrev.toFixed(1)}%</span>}
          </div>
          <div style={{ height: 5, borderRadius: 3, backgroundColor: 'var(--color-border-tertiary)' }}>
            <div style={{ height: '100%', borderRadius: 3, backgroundColor: st.color, width: `${Math.min(covCurr, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Ecommerce / Custom event — counts */}
      {isCount && cntCurr != null && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: st.color }}>{Number(cntCurr).toLocaleString()}</span>
          {cntPrev != null && Number(cntPrev) > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>prev: {Number(cntPrev).toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Plain number */}
      {typeof check.value === 'number' && (
        <div style={{ fontSize: 18, fontWeight: 700, color: st.color, marginBottom: 4 }}>{check.value.toFixed(1)}</div>
      )}

      {check.message && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{check.message}</div>}
    </div>
  )
}
