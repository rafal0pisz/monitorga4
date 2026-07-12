import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector    from '@/components/project/PeriodSelector'
import RunNowButton      from '@/components/project/RunNowButton'
import LiveChecksPanel   from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import Link from 'next/link'
import PDFExportButton from '@/components/project/PDFExportButton'
import ScoreTrendChart from '@/components/project/ScoreTrendChart'
import AccountMismatch from '@/components/project/AccountMismatch'
import { checkLabel, CORE_CHECK_SECTION } from '@/lib/ga4/checkLabels'
import { formatCoreCheckForPanel } from '@/lib/ga4/coreCheckDisplay'
import { scoreColor } from '@/types'

type RunRow = { id: string; run_date: string; score_total: number | null; status: string }
type SectionId = 'traffic' | 'engagement' | 'users' | 'ecommerce' | 'custom_events' | 'parameters'

// Worker saves results with column check_key (not check_id)
function storedSection(checkKey: string | null | undefined): SectionId | null {
  if (!checkKey) return null
  if (CORE_CHECK_SECTION[checkKey]) return CORE_CHECK_SECTION[checkKey]
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


// pageResponsive
function PageStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        /* This page's own sub-nav is sticky at top:0 — fine on desktop,
           but on mobile the sidebar's hamburger/logo bar is a separate
           fixed 52px strip above everything. Without this override the
           sub-nav (higher z-index) scrolls up and sits exactly on top of
           it, hiding the hamburger button entirely instead of stacking
           below it. 52px must match MOBILE_TOPBAR_HEIGHT in
           src/components/layout/AppSidebar.tsx.
        */
        .page-top-nav { top: 52px !important; }

        /* Extra gap + a divider between the back/name row and the actions
           row (Period/PDF/Settings/Run now) — stacked with nothing but 8px
           between them, "Settings" sat right under the back link and read
           as one crowded cluster instead of two distinct rows. This nav
           also sits inside .app-main (10px horizontal padding already) —
           its own side padding only needs to be small, not stack another
           16px on top. */
        .page-nav-row { flex-direction: column !important; align-items: stretch !important; height: auto !important; padding: 10px 6px !important; gap: 10px; }
        .page-nav-actions { flex-wrap: wrap; gap: 8px !important; justify-content: flex-start !important; padding-top: 8px; border-top: 0.5px solid var(--color-border-tertiary); }
        .page-score-header { flex-direction: column !important; padding: 14px !important; gap: 10px !important; }
        .page-grid { grid-template-columns: 1fr !important; }
        .page-history-table { font-size: 11px !important; }
        .page-settings-grid { grid-template-columns: 1fr !important; }
        /* This wrap sits inside .app-main (app/dashboard/layout.tsx), which
           already applies its own 10px horizontal padding on mobile (see
           src/components/layout/AppSidebar.tsx) — this wrap was adding a
           SECOND, redundant layer of horizontal padding on top of that
           (18px combined per side), unlike every other dashboard page
           (Overview, Billing, etc.), which only pads once via .app-main.
           Dropping the horizontal padding here brings this page in line
           with the rest of the dashboard and actually uses the screen. */
        .page-content-wrap { padding: 10px 0 !important; }
        .page-check-card { padding: 10px 12px !important; }
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
  if (!bypass && project.owner_id !== authData!.user!.id) return <AccountMismatch />

  const { data: runsRaw } = await admin
    .from('dqs_runs').select('id, run_date, score_total, status')
    .eq('project_id', id).order('run_date', { ascending: false }).limit(30)
  const runs = (runsRaw ?? []) as RunRow[]
  const latestRun = runs[0] ?? null

  const { data: storedResults } = latestRun
    ? await admin.from('dqs_results').select('*').eq('run_id', latestRun.id)
    : { data: [] }

  const { data: ecomRaw } = await admin.rpc('get_ecommerce_config', { p_project_id: id })
  const ecomArr = Array.isArray(ecomRaw) ? ecomRaw : []
  const ecomEvents: string[] = ecomArr.filter((e: any) => e.is_enabled !== false).map((e: any) => e.event_name as string)

  const bySection: Record<SectionId, any[]> = { traffic: [], engagement: [], users: [], ecommerce: [], custom_events: [], parameters: [] }
  for (const r of storedResults ?? []) {
    try {
      // Worker uses check_key column
      const s = storedSection(r.check_key)
      if (s) bySection[s].push(r)
    } catch { /* skip malformed rows */ }
  }

  const expectedEvents: string[] = Array.isArray(project.expected_events) ? project.expected_events : []

  const coreExtraChecks = [...bySection.traffic, ...bySection.engagement, ...bySection.users]
    .map(r => formatCoreCheckForPanel(r))
    .filter((c): c is NonNullable<typeof c> => c != null)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)' }}>
      <PageStyles />
      <nav className="page-top-nav" style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="page-nav-row" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', flexShrink: 0 }}>← Dashboard</Link>
            <span style={{ color: 'var(--color-border-tertiary)', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
          </div>
          <div className="page-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Suspense fallback={<div style={{ width: 200, height: 24 }} />}>
              <PeriodSelector current={periodDays} />
            </Suspense>
            <PDFExportButton projectName={project.name} />
            <Link href={`/project/${id}/config`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              Settings
            </Link>
            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>

      <div className="page-content-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

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
        {runs.length > 1 && <ScoreTrendChart runs={runs} alertThreshold={project.alert_threshold} />}

        {/* Traffic Source / Engagement / Users — live on-demand checks plus
            the 9 always-on checks from the last daily run, merged into the
            same sections rather than shown as a separate duplicate block. */}
        {project.ga4_property_id
          ? <LiveChecksPanel projectId={id} period={periodDays} extraChecks={coreExtraChecks} />
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
                  <EventsDetailPanel projectId={id} expectedEvents={expectedEvents} periodDays={periodDays} />
                </div>
              )}
              {sectionId === 'ecommerce' && ecomEvents.length > 0 && project.ga4_property_id && (
                <div style={{ marginTop: 14 }}>
                  <EventsDetailPanel projectId={id} expectedEvents={ecomEvents} periodDays={periodDays} />
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
  const st    = STATUS[check.status ?? 'skip'] ?? STATUS.skip
  const rawKey = check.check_key ?? check.check_id ?? '—'
  const isParam  = typeof rawKey === 'string' && rawKey.startsWith('param_')
  const isCount  = typeof rawKey === 'string' && (rawKey.startsWith('ecom_') || rawKey.startsWith('custom_event_'))
  // Parameter checks share one generic label ("Parameter coverage") — use
  // the "event.parameter" prefix already in the message instead, so each
  // card still reads as which check it actually is.
  const paramLabel = isParam && typeof check.message === 'string' ? check.message.split(':')[0] : null
  const label = paramLabel ?? (typeof rawKey === 'string' ? checkLabel(rawKey) : rawKey)
  const val      = check.value && typeof check.value === 'object' ? check.value : null
  const covCurr  = isParam  && val ? (val.coverage_current ?? null) : null
  const covPrev  = isParam  && val ? (val.coverage_prev   ?? null) : null
  const cntCurr  = isCount  && val ? (val.current ?? null) : null
  const cntPrev  = isCount  && val ? (val.prev    ?? null) : null

  return (
    <div className="page-check-card" style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
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
