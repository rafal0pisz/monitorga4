import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import PeriodSelector from '@/components/project/PeriodSelector'
import PDFExportButton from '@/components/project/PDFExportButton'
import ScoreTrendChart from '@/components/project/ScoreTrendChart'
import { SectionBlock } from '@/components/project/CheckCardShared'
import { EventCard, type EventData } from '@/components/project/EventCardShared'
import { type ParameterData, type CoverageResult } from '@/components/project/ParameterCardShared'
import DemoParametersPanel from '@/components/demo/DemoParametersPanel'
import { DEMO_PROJECT_DETAIL } from '@/lib/demo/data'
import { scoreColor } from '@/types'

const SECTION_META = {
  ecommerce:     { label: 'Ecommerce',     accent: '#f97316' },
  custom_events: { label: 'Custom Events', accent: '#ca8a04' },
} as const

// Purely cosmetic: switching Period in this fixed demo can't run a new GA4
// query, so instead it scales the example counts by how many days are now
// in view — clicking around still visibly does something, without
// pretending to be live data.
function scaleEvent(data: EventData, factor: number): EventData {
  const scale = (n: number) => Math.max(0, Math.round(n * factor))
  return {
    current: data.current.map(d => ({ ...d, count: scale(d.count) })),
    prev: data.prev.map(d => ({ ...d, count: scale(d.count) })),
    totalCurrent: scale(data.totalCurrent),
    totalPrev: scale(data.totalPrev),
  }
}
function scaleCoverage(c: CoverageResult, factor: number): CoverageResult {
  const total = Math.max(1, Math.round(c.total_events * factor))
  return { ...c, total_events: total, events_with_value: Math.round(c.events_with_value * factor), top_values: c.top_values.map(v => ({ ...v, count: Math.round(v.count * factor) })) }
}
function scaleParam(p: ParameterData, factor: number): ParameterData {
  return { ...p, current: scaleCoverage(p.current, factor), prev: scaleCoverage(p.prev, factor) }
}

function PageStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .page-top-nav { position: static !important; }
        .page-nav-row { flex-direction: column !important; align-items: stretch !important; height: auto !important; padding: 8px 4px !important; gap: 10px; }
        .page-nav-actions { flex-wrap: wrap; gap: 8px !important; justify-content: flex-start !important; padding-top: 8px; border-top: 0.5px solid var(--color-border-tertiary); }
        .page-score-header { flex-direction: column !important; padding: 14px !important; gap: 10px !important; }
        .page-grid { grid-template-columns: 1fr !important; }
        .page-content-wrap { padding: 10px 0 !important; }
      }
      @media (max-width: 480px) {
        .page-period-label { display: none !important; }
      }
    `}</style>
  )
}

export default async function DemoProjectPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string; anchor?: string }>
}) {
  const { id } = await params
  const { period, anchor } = await searchParams
  const detail = DEMO_PROJECT_DETAIL[id]
  if (!detail) return notFound()

  const periodDays = Number(period) || 7
  const anchorOffset = anchor === '0' ? 0 : 1
  const scaleFactor = periodDays / 7

  const { summary, runs, checks, ecommerce, customEvents, parameters } = detail
  const latestRun = runs[0]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)' }}>
      <PageStyles />
      <nav className="page-top-nav" style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="page-nav-row" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/demo" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', flexShrink: 0 }}>← Projects</Link>
            <span style={{ color: 'var(--color-border-tertiary)', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.name}</span>
          </div>
          <div className="page-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Suspense fallback={<div style={{ width: 200, height: 24 }} />}>
              <PeriodSelector current={periodDays} excludeYesterday={anchorOffset === 1} />
            </Suspense>
            <PDFExportButton projectName={summary.name} />
            <Link href={`/demo/project/${id}/history`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              History
            </Link>
            <Link href="/login" title="Sign up to run a live check on your own property" style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, background: '#16a34a', color: '#fff', fontWeight: 500, textDecoration: 'none' }}>
              ▶ Run now
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-content-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          padding: '10px 14px', borderRadius: 10, background: '#f0fdfa', border: '0.5px solid #99f6e4',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: '#0e9488' }} />
          <span style={{ fontSize: 12.5, color: '#0f766e' }}>
            Fixed example data for this demo — Period and Export still work, but numbers won’t change from a real GA4 query.
          </span>
        </div>

        {/* Score header */}
        <div className="page-score-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 28, backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>GA4 Property</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{summary.ga4_property_id}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Last run: {latestRun.run_date}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>No sampling. 100% of data read.</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              "Exclude yesterday" is checked by default below — GA4 often doesn't have complete data for yesterday yet.
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Overall Score</div>
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: scoreColor(latestRun.score_total) }}>{Math.round(latestRun.score_total)}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>/100</div>
          </div>
        </div>

        <ScoreTrendChart runs={runs} alertThreshold={summary.alert_threshold} />

        {(['traffic', 'engagement', 'users'] as const).map(s => (
          <SectionBlock key={s} id={s} checks={checks.filter(c => c.section === s)} />
        ))}

        {(['ecommerce', 'custom_events'] as const).map(sectionId => {
          const meta = SECTION_META[sectionId]
          const events = sectionId === 'ecommerce' ? ecommerce : customEvents
          const emptyMsg = sectionId === 'ecommerce'
            ? 'This demo project has no ecommerce events configured.'
            : 'No custom events configured for this demo project.'
          return (
            <div key={sectionId} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
                <span style={{ fontSize: 20, fontWeight: 700 }}>{meta.label}</span>
              </div>
              {events.length === 0
                ? <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{emptyMsg}</div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {events.map(ev => <EventCard key={ev.name} name={ev.name} data={scaleEvent(ev.data, scaleFactor)} />)}
                  </div>
                )}
            </div>
          )
        })}

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#8b5cf6' }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Parameters</span>
          </div>
          {parameters.length === 0
            ? <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>No parameter checks configured for this demo project.</div>
            : <DemoParametersPanel parameters={parameters.map(p => scaleParam(p, scaleFactor))} />}
        </div>
      </div>
    </div>
  )
}
