import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector    from '@/components/project/PeriodSelector'
import RunNowButton      from '@/components/project/RunNowButton'
import LiveChecksPanel   from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import ParameterCoveragePanel from '@/components/project/ParameterCoveragePanel'
import Link from 'next/link'
import PDFExportButton from '@/components/project/PDFExportButton'
import ScoreTrendChart from '@/components/project/ScoreTrendChart'
import AccountMismatch from '@/components/project/AccountMismatch'
import { scoreColor } from '@/types'

type RunRow = { id: string; run_date: string; score_total: number | null; status: string; sampled: boolean | null; sampling_ratio: number | null }

const SECTION_META = {
  ecommerce:     { label: 'Ecommerce',     accent: '#f97316' },
  custom_events: { label: 'Custom Events', accent: '#ca8a04' },
  parameters:    { label: 'Parameters',    accent: '#8b5cf6' },
} as const


// pageResponsive
function PageStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        /* This page's own sub-nav is position:sticky on desktop. On mobile
           that's actually broken: .app-main has overflow-y:auto, but the
           page never really scrolls inside it (the flex row uses
           min-height:100vh, so it grows and the WINDOW scrolls instead) —
           sticky resolves against .app-main's box, not the real viewport,
           so it either overlapped the score card at rest or silently
           stopped sticking at all once scrolled. Verified by rendering the
           actual layout at a mobile viewport. Simplest fix: don't try to
           keep it pinned on mobile at all — let it scroll away like any
           other content, same as the score card below it.
        */
        .page-top-nav { position: static !important; }

        /* Extra gap + a divider between the back/name row and the actions
           row (Period/PDF/Settings/Run now) — stacked with nothing but 8px
           between them, "Settings" sat right under the back link and read
           as one crowded cluster instead of two distinct rows. This nav
           also sits inside .app-main (8px horizontal padding already) —
           its own side padding only needs to be small, not stack another
           16px on top. */
        .page-nav-row { flex-direction: column !important; align-items: stretch !important; height: auto !important; padding: 8px 4px !important; gap: 10px; }
        .page-nav-actions { flex-wrap: wrap; gap: 8px !important; justify-content: flex-start !important; padding-top: 8px; border-top: 0.5px solid var(--color-border-tertiary); }
        .page-score-header { flex-direction: column !important; padding: 14px !important; gap: 10px !important; }
        .page-grid { grid-template-columns: 1fr !important; }
        .page-history-table { font-size: 11px !important; }
        .page-settings-grid { grid-template-columns: 1fr !important; }
        /* This wrap sits inside .app-main (app/dashboard/layout.tsx), which
           already applies its own horizontal padding on mobile (see
           src/components/layout/AppSidebar.tsx) — this wrap was adding a
           SECOND, redundant layer of horizontal padding on top of that
           (18px combined per side), unlike every other dashboard page
           (Overview, Billing, etc.), which only pads once via .app-main.
           Dropping the horizontal padding here brings this page in line
           with the rest of the dashboard and actually uses the screen. */
        .page-content-wrap { padding: 10px 0 !important; }
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
  searchParams: Promise<{ period?: string; ran?: string; anchor?: string }>
}) {
  const { id }       = await params
  const { period, ran, anchor } = await searchParams
  const periodDays = Number(period) || 7
  // '1' shifts every live panel's window back by one extra day (so it ends
  // 2 days ago instead of yesterday) — a manual escape hatch for when
  // yesterday's GA4 data is still processing and looks like a false anomaly.
  const anchorOffset = anchor === '1' ? 1 : 0
  // Bumped by RunNowButton after a manual run completes — used as part of
  // the live panels' React key below so they remount and refetch fresh GA4
  // data instead of silently keeping whatever they'd already fetched
  // (router.refresh() alone only re-renders server data, it doesn't make a
  // client component's own useEffect re-fire).
  const liveKey = `${periodDays}-${anchorOffset}-${ran ?? ''}`

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const admin = createAdminClient()

  const { data: project } = await admin.from('projects').select('*').eq('id', id).single()
  if (!project) return notFound()
  if (!bypass && project.owner_id !== authData!.user!.id) return <AccountMismatch />

  const { data: runsRaw } = await admin
    .from('dqs_runs').select('id, run_date, score_total, status, sampled, sampling_ratio')
    .eq('project_id', id).order('run_date', { ascending: false }).limit(30)
  const runs = (runsRaw ?? []) as RunRow[]
  const latestRun = runs[0] ?? null

  // Independent queries — same project, no data dependency — run as one
  // round trip instead of two sequential ones.
  const [{ data: ecomRaw }, { data: paramRaw }] = await Promise.all([
    admin.rpc('get_ecommerce_config', { p_project_id: id }),
    admin.rpc('get_parameter_checks', { p_project_id: id }),
  ])
  const ecomArr = Array.isArray(ecomRaw) ? ecomRaw : []
  const ecomEvents: string[] = ecomArr.filter((e: any) => e.is_enabled !== false).map((e: any) => e.event_name as string)
  const paramArr = Array.isArray(paramRaw) ? paramRaw : []
  const parameterChecks: { event_name: string; parameter_name: string }[] =
    paramArr.map((p: any) => ({ event_name: p.event_name, parameter_name: p.parameter_name }))

  const expectedEvents: string[] = Array.isArray(project.expected_events) ? project.expected_events : []

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
              <PeriodSelector current={periodDays} excludeYesterday={anchorOffset === 1} />
            </Suspense>
            <PDFExportButton projectName={project.name} />
            <Link href={`/project/${id}/history`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              History
            </Link>
            <Link href={`/project/${id}/config`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              Settings
            </Link>
            <Suspense fallback={<div style={{ width: 84, height: 26 }} />}>
              <RunNowButton projectId={id} />
            </Suspense>
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
            {/* GA4 can return sampled (not exact) numbers once a non-360
                property's query volume/complexity crosses its threshold —
                shown only once we actually know (sampled is null for runs
                from before this was tracked). */}
            {latestRun?.sampled != null && (
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {latestRun.sampled
                  ? `Sampling: data sampling level: ${latestRun.sampling_ratio != null ? Math.round(latestRun.sampling_ratio * 100) : '?'}%. There may be differences from the raw data. Trends should be preserved.`
                  : 'No sampling. 100% of data read.'}
              </div>
            )}
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

        {/* Traffic Source / Engagement / Users — fully live/on-demand, same
            as Ecommerce/Custom Events/Parameters below. Used to also merge
            in 9 "core" checks from the last stored daily run, but those were
            frozen at yesterday-vs-last-week regardless of Period or the
            "Exclude yesterday" toggle — confusing next to cards that did
            react. Every one of those 9 concepts now has a live equivalent
            here instead (built to match the worker's own thresholds), so
            the stored version is no longer shown. The daily run itself is
            unaffected — still computed and stored for scoring/history/alerts. */}
        {project.ga4_property_id
          ? <LiveChecksPanel key={liveKey} projectId={id} period={periodDays} anchorOffset={anchorOffset} />
          : <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 24, backgroundColor: '#fefce8', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>No GA4 property configured. <Link href={`/project/${id}/config`} style={{ color: '#16a34a' }}>Open Settings →</Link></div>
        }

        {/* Ecommerce / Custom Events / Parameters — all three are live-only
            now, Period-reactive. They used to also show a stored daily card
            (fixed at yesterday-vs-same-day-last-week) alongside the live
            view below it — same summary info twice, one of them never
            reacting to Period, which read as "stuck on weekly data" next to
            a chart that visibly did react. EventsDetailPanel's EventCard and
            ParameterCoveragePanel's mini cards already carry the same
            per-item summary (name, total/coverage, WoW delta) the stored
            cards did, so nothing is lost by dropping the stored one. The
            checks are still computed and stored by the worker for scoring —
            only the redundant, non-reactive display here is gone. */}
        {(['ecommerce', 'custom_events', 'parameters'] as const).map(sectionId => {
          const meta = SECTION_META[sectionId]
          const emptyMsg = {
            ecommerce:     'No ecommerce checks — configure in project settings.',
            custom_events: 'No custom events configured — add expected events in settings.',
            parameters:    'No parameter checks configured — set up in project settings.',
          }[sectionId]
          const liveEvents = sectionId === 'ecommerce' ? ecomEvents : sectionId === 'custom_events' ? expectedEvents : []
          const isEmpty = sectionId === 'parameters' ? parameterChecks.length === 0 : liveEvents.length === 0

          return (
            <div key={sectionId} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
                <span style={{ fontSize: 20, fontWeight: 700 }}>{meta.label}</span>
              </div>
              {isEmpty || !project.ga4_property_id
                ? <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{emptyMsg}</div>
                : sectionId === 'parameters'
                  ? <ParameterCoveragePanel key={liveKey} projectId={id} parameterChecks={parameterChecks} periodDays={periodDays} anchorOffset={anchorOffset} />
                  : <EventsDetailPanel key={liveKey} projectId={id} expectedEvents={liveEvents} periodDays={periodDays} anchorOffset={anchorOffset} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

