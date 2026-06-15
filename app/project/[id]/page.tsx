import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Project, DqsRun, DqsResult, ChecksCatalog, ScoreHistory, ProjectSections, ParameterCheck } from '@/types'
import { getScoreGrade, DEFAULT_SECTIONS } from '@/types'
import Link from 'next/link'
import RunNowButton from '@/components/project/RunNowButton'
import ScoreSparklineLight from '@/components/project/ScoreSparklineLight'
import PeriodSelector from '@/components/project/PeriodSelector'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import ParameterCoveragePanel from '@/components/project/ParameterCoveragePanel'

// ── Check → section mapping ───────────────────────────────────
const CHECK_SECTION: Record<string, string> = {
  expected_events:      'traffic',
  self_referral:        'traffic',
  direct_traffic_spike: 'traffic',
  bounce_rate_anomaly:  'engagement',
  conversion_rate:      'engagement',
  page_title_null:      'engagement',
  session_no_events:    'engagement',
  purchase_duplicates:  'ecommerce',
  ecommerce_events:     'ecommerce',
  custom_events_check:  'custom_events',
  geo_anomaly:          'users',
  bot_traffic_night:    'users',
}

function getWoWRanges(periodDays = 7) {
  const today = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endC = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - (periodDays - 1))
  const endP = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - (periodDays - 1))
  return { current: `${fmt(startC)} – ${fmt(endC)}`, prev: `${fmt(startP)} – ${fmt(endP)}` }
}

const G = {
  color:  { excellent:'#16a34a', good:'#ca8a04', warning:'#ea580c', critical:'#dc2626' },
  bg:     { excellent:'#f0fdf4', good:'#fefce8', warning:'#fff7ed', critical:'#fef2f2' },
  border: { excellent:'#bbf7d0', good:'#fef08a', warning:'#fed7aa', critical:'#fecaca' },
  label:  { excellent:'Excellent', good:'Good', warning:'Warning', critical:'Critical' },
}
const ST = {
  accent: { pass:'#16a34a', warn:'#ca8a04', fail:'#dc2626' },
  color:  { pass:'#16a34a', warn:'#ca8a04', fail:'#dc2626' },
  bg:     { pass:'#dcfce7', warn:'#fef9c3', fail:'#fee2e2' },
  border: { pass:'#bbf7d0', warn:'#fef08a', fail:'#fecaca' },
  icon:   { pass:'✓', warn:'!', fail:'✕' },
}

function VerifData({ checkKey, value, ranges, project }: {
  checkKey: string; value: Record<string, unknown> | null
  ranges: { current: string; prev: string }; project: Project
}) {
  if (!value || value.mock || value.placeholder || value.error) return null
  const v = value
  const items: { label: string; val: string; hi?: boolean }[] = []

  if (checkKey === 'expected_events') {
    const expected = project.expected_events ?? []
    const missing: string[] = Array.isArray(v.missing) ? v.missing as string[] : []
    const missingSet = new Set(missing)
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {expected.map(ev => {
            const isMissing = missingSet.has(ev)
            return <span key={ev} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4, background: isMissing ? '#fef2f2' : '#f0fdf4', border: `0.5px solid ${isMissing ? '#fecaca' : '#bbf7d0'}`, color: isMissing ? '#dc2626' : '#16a34a', textDecoration: isMissing ? 'line-through' : 'none' }}>{ev}</span>
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {[{ label: 'Configured', val: `${expected.length}` }, { label: 'Found', val: `${expected.length - missing.length} / ${expected.length}` }, ...(missing.length > 0 ? [{ label: 'Missing', val: String(missing.length), hi: true }] : []), { label: 'Period', val: 'last 30 days' }].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 1 }}>{item.label}</div>
              <div style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)', color: item.hi ? '#dc2626' : 'var(--color-text-primary)' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (checkKey === 'self_referral') {
    if (v.ratio !== undefined) items.push({ label: 'Self-referral %', val: `${v.ratio}%`, hi: Number(v.ratio) > 0 })
    if (v.self_sessions !== undefined) items.push({ label: 'Self-ref sessions', val: String(v.self_sessions) })
    if (v.total !== undefined) items.push({ label: 'Total sessions', val: String(v.total) })
  } else if (checkKey === 'bounce_rate_anomaly') {
    if (v.current !== undefined) items.push({ label: `Bounce current (${ranges.current})`, val: `${v.current}%` })
    if (v.prev !== undefined) items.push({ label: `Bounce prev (${ranges.prev})`, val: `${v.prev}%` })
    if (v.delta !== undefined) items.push({ label: 'WoW change', val: `${Number(v.delta) > 0 ? '+' : ''}${v.delta}%`, hi: Math.abs(Number(v.delta)) > 20 })
  } else if (checkKey === 'direct_traffic_spike') {
    if (v.direct_ratio_current !== undefined) items.push({ label: `Direct current (${ranges.current})`, val: `${v.direct_ratio_current}%` })
    if (v.direct_ratio_prev !== undefined) items.push({ label: `Direct prev (${ranges.prev})`, val: `${v.direct_ratio_prev}%` })
    if (v.delta !== undefined) items.push({ label: 'WoW change', val: `${Number(v.delta) > 0 ? '+' : ''}${v.delta}%`, hi: Number(v.delta) > 15 })
  } else if (checkKey === 'conversion_rate') {
    if (v.cr_current !== undefined) items.push({ label: `CR current (${ranges.current})`, val: `${v.cr_current}%` })
    if (v.cr_prev !== undefined) items.push({ label: `CR prev (${ranges.prev})`, val: `${v.cr_prev}%` })
    if (v.delta !== undefined) items.push({ label: 'WoW change', val: `${Number(v.delta) > 0 ? '+' : ''}${v.delta}%`, hi: Math.abs(Number(v.delta)) > 25 })
  } else if (checkKey === 'page_title_null') {
    if (v.null_rate !== undefined) items.push({ label: 'Null rate', val: `${v.null_rate}%`, hi: Number(v.null_rate) > 2 })
    if (v.null_sessions !== undefined) items.push({ label: 'Sessions without title', val: String(v.null_sessions) })
    if (v.total !== undefined) items.push({ label: 'Total sessions', val: String(v.total) })
  } else if (checkKey === 'bot_traffic_night') {
    if (v.night_ratio_current !== undefined) items.push({ label: `Night traffic current (${ranges.current})`, val: `${v.night_ratio_current}%` })
    if (v.night_ratio_prev !== undefined) items.push({ label: `Night traffic prev (${ranges.prev})`, val: `${v.night_ratio_prev}%` })
    if (v.delta !== undefined) items.push({ label: 'WoW change', val: `${Number(v.delta) > 0 ? '+' : ''}${v.delta}%`, hi: Number(v.delta) > 50 })
  } else if (checkKey === 'purchase_duplicates') {
    if (v.ratio_current !== undefined) items.push({ label: `Purchase/session current (${ranges.current})`, val: String(v.ratio_current) })
    if (v.ratio_prev !== undefined) items.push({ label: `Purchase/session prev (${ranges.prev})`, val: String(v.ratio_prev) })
    if (v.delta !== undefined) items.push({ label: 'WoW change', val: `${Number(v.delta) > 0 ? '+' : ''}${v.delta}%`, hi: Number(v.delta) > 10 })
  } else if (checkKey === 'geo_anomaly') {
    if (Array.isArray(v.top5_current)) items.push({ label: `Top 5 countries (${ranges.current})`, val: (v.top5_current as string[]).join(', ') })
    if (Array.isArray(v.new_countries) && (v.new_countries as string[]).length > 0) items.push({ label: 'New countries', val: (v.new_countries as string[]).join(', '), hi: true })
  } else if (checkKey === 'session_no_events') {
    if (v.ratio !== undefined) items.push({ label: 'Sessions without engagement', val: `${v.ratio}%`, hi: Number(v.ratio) > 5 })
    if (v.estimated_empty !== undefined) items.push({ label: 'Estimated count', val: String(v.estimated_empty) })
    if (v.total_sessions !== undefined) items.push({ label: 'Total sessions', val: String(v.total_sessions) })
  }

  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 8 }}>
      {items.map(item => (
        <div key={item.label}>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 1 }}>{item.label}</div>
          <div style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)', color: item.hi ? '#dc2626' : 'var(--color-text-primary)' }}>{item.val}</div>
        </div>
      ))}
    </div>
  )
}

function CheckRow({ result, def, ranges, project, periodDays }: { result: DqsResult; def: ChecksCatalog | undefined; ranges: { current: string; prev: string }; project: Project; periodDays: number }) {
  const st = result.status as 'pass' | 'warn' | 'fail'
  return (
    <div style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 3, flexShrink: 0, background: ST.accent[st] }} />
      <div style={{ flex: 1, padding: '13px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: ST.bg[st], color: ST.color[st], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0, marginTop: 1 }}>
          {ST.icon[st]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{def?.label ?? result.check_key}</span>
            <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 3, ...(result.check_level === 'core' ? { background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' } : { background: '#fefce8', color: '#ca8a04', border: '0.5px solid #fef08a' }) }}>
              {result.check_level === 'core' ? 'CORE' : 'OPT'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: ST.color[st], margin: '0 0 2px', fontWeight: 500 }}>{result.message}</p>
          <VerifData checkKey={result.check_key} value={result.value} ranges={ranges} project={project} />
          {result.check_key === 'expected_events' && project.expected_events?.length > 0 && (
            <EventsDetailPanel propertyId={project.ga4_property_id} expectedEvents={project.expected_events} periodDays={periodDays} />
          )}
          {result.status === 'fail' && def?.fail_advice && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#9a3412', background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 7, padding: '7px 11px' }}>
              💡 {def.fail_advice}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: ST.bg[st], border: `0.5px solid ${ST.border[st]}`, color: ST.color[st], whiteSpace: 'nowrap' }}>
          {ST.icon[st]} {result.score.toFixed(0)}/{result.weight.toFixed(0)} pts
        </span>
      </div>
    </div>
  )
}

function SectionBlock({ title, icon, results, cat, ranges, project, periodDays, empty }: {
  title: string; icon: string; results: DqsResult[]; cat: ChecksCatalog[]
  ranges: { current: string; prev: string }; project: Project; periodDays: number; empty?: React.ReactNode
}) {
  const failCount = results.filter(r => r.status === 'fail').length
  const warnCount = results.filter(r => r.status === 'warn').length
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {failCount > 0 && <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '0.5px solid #fecaca' }}>{failCount} fail</span>}
          {warnCount > 0 && <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04', border: '0.5px solid #fef08a' }}>{warnCount} warn</span>}
          {failCount === 0 && warnCount === 0 && results.length > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}>All OK</span>}
        </div>
      </div>
      {results.length === 0 ? (empty ?? <div style={{ padding: '20px 18px', textAlign: 'center' }}><p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No data — click Run now</p></div>) : (
        results.map(r => <CheckRow key={r.check_key} result={r} def={cat.find(c => c.check_key === r.check_key)} ranges={ranges} project={project} periodDays={periodDays} />)
      )}
    </div>
  )
}

export default async function ProjectPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id } = await params
  const { period } = await searchParams
  const periodDays = parseInt(period ?? '7')

  const supabase = createAdminClient()
  const [{ data: project }, { data: lastRun }, { data: history }, { data: catalog }, { data: paramChecksRaw }, { data: customEventsRaw }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('dqs_runs').select('*').eq('project_id', id).eq('status', 'completed').order('run_date', { ascending: false }).limit(1).single(),
    supabase.rpc('get_score_history', { p_project_id: id, p_days: 30 }),
    supabase.from('checks_catalog').select('*').order('level').order('check_key'),
    supabase.rpc('get_parameter_checks', { p_project_id: id }),
    supabase.rpc('get_custom_event_checks', { p_project_id: id }),
  ])

  const parseRpc = (raw: any) => {
    if (!raw) return []
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
    return Array.isArray(raw) ? raw : []
  }
  const paramChecks = parseRpc(paramChecksRaw)
  const customEvents = parseRpc(customEventsRaw)

  if (!project) notFound()

  const p = project as Project
  const run = lastRun as DqsRun | null
  const hist = (history ?? []) as ScoreHistory[]
  const cat = (catalog ?? []) as ChecksCatalog[]
  // Read sections — RPC to bypass PostgREST cache, with fallback
  let sections: ProjectSections = { ...DEFAULT_SECTIONS }
  try {
    const { data: sectionsRaw } = await supabase.rpc('get_project_sections', { p_project_id: id })
    const anyRaw = sectionsRaw ?? (p as any).sections
    if (anyRaw && typeof anyRaw === 'object') {
      sections = { ...DEFAULT_SECTIONS, ...anyRaw }
    } else if (typeof anyRaw === 'string') {
      try { sections = { ...DEFAULT_SECTIONS, ...JSON.parse(anyRaw) } } catch {}
    }
  } catch {}

  let results: DqsResult[] = []
  if (run) {
    const { data } = await supabase.from('dqs_results').select('*').eq('run_id', run.id)
    results = (data ?? []) as DqsResult[]
  }

  const grade = getScoreGrade(run?.score_total ?? null)
  const ranges = getWoWRanges(periodDays)
  const passCount = results.filter(r => r.status === 'pass').length
  const warnCount = results.filter(r => r.status === 'warn').length
  const failCount = results.filter(r => r.status === 'fail').length

  const bySection = (key: string) => results.filter(r => CHECK_SECTION[r.check_key] === key)
  const card = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10 }

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 3px', color: 'var(--color-text-primary)' }}>{p.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>{p.ga4_property_id}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <RunNowButton projectId={p.id} />
          <Link href={`/share/${p.share_token}`} target="_blank" style={{ fontSize: 12, padding: '5px 11px', borderRadius: 7, textDecoration: 'none', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)' }}>Share</Link>
          <Link href={`/project/${p.id}/config`} style={{ fontSize: 12, padding: '5px 11px', borderRadius: 7, textDecoration: 'none', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)' }}>Settings</Link>
        </div>
      </div>

      {/* Score + sparkline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Quality Score</p>
          {run ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, color: G.color[grade] }}>{Math.round(run.score_total ?? 0)}</span>
                <span style={{ fontSize: 13, color: 'var(--color-border-primary)', marginBottom: 3 }}>/100</span>
              </div>
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: G.bg[grade], border: `0.5px solid ${G.border[grade]}`, color: G.color[grade], marginBottom: 8 }}>
                {G.label[grade]}
              </span>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                {new Date(run.ran_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '0.5px solid var(--color-border-tertiary)', fontSize: 12 }}>
                <span><strong style={{ color: '#16a34a' }}>{passCount}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>pass</span></span>
                <span><strong style={{ color: '#ca8a04' }}>{warnCount}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>warn</span></span>
                <span><strong style={{ color: '#dc2626' }}>{failCount}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>fail</span></span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '8px 0' }}>No data — click Run now</p>
          )}
        </div>
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>30-day trend</p>
          <ScoreSparklineLight data={hist} alertThreshold={p.alert_threshold} />
          {hist.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              <span>{hist.length} measurements</span>
              <span>alert threshold: <strong style={{ color: 'var(--color-text-primary)' }}>{p.alert_threshold}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Period bar */}
      <div style={{ ...card, padding: '8px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📅</span>
          <span><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }} /><strong style={{ color: 'var(--color-text-primary)' }}>{ranges.current}</strong></span>
          <span style={{ color: 'var(--color-text-secondary)' }}>vs {ranges.prev}</span>
        </div>
        <PeriodSelector current={periodDays} />
      </div>

      {/* ── SECTIONS — always visible ── */}
      <SectionBlock title="Traffic source" icon="ti-arrows-exchange" results={bySection('traffic')} cat={cat} ranges={ranges} project={p} periodDays={periodDays} />
      <SectionBlock title="Engagement" icon="ti-activity" results={bySection('engagement')} cat={cat} ranges={ranges} project={p} periodDays={periodDays} />
      <SectionBlock title="Users" icon="ti-users" results={bySection('users')} cat={cat} ranges={ranges} project={p} periodDays={periodDays} />

      {/* Ecommerce — always shown */}
      <SectionBlock title="Ecommerce" icon="ti-shopping-cart" results={bySection('ecommerce')} cat={cat} ranges={ranges} project={p} periodDays={periodDays}
        empty={
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>No ecommerce data yet.</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Go to <strong>Settings → Ecommerce</strong> to select which events to monitor, then click Run now.</p>
          </div>
        }
      />

      {/* Custom events — always shown, with check results if available */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-bolt" style={{ fontSize: 14, color: '#ca8a04' }} aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Custom events</span>
          {bySection('custom_events').length > 0 && (() => {
            const fails = bySection('custom_events').filter(r => r.status === 'fail').length
            const warns = bySection('custom_events').filter(r => r.status === 'warn').length
            return fails > 0
              ? <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{fails} fail</span>
              : warns > 0
              ? <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' }}>{warns} warn</span>
              : <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>All OK</span>
          })()}
        </div>
        {bySection('custom_events').length > 0 ? (
          bySection('custom_events').map(r => <CheckRow key={r.check_key} result={r} def={cat.find(c => c.check_key === r.check_key)} ranges={ranges} project={p} periodDays={periodDays} />)
        ) : (customEvents ?? []).length === 0 ? (
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 4px' }}>No custom events configured.</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Go to <strong>Settings → Custom events</strong> to add events, then click Run now.</p>
          </div>
        ) : (
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {(customEvents ?? []).map((ev: any) => (
                <span key={ev.event_name} style={{ fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' }}>
                  {ev.event_name} <span style={{ opacity: 0.6 }}>·{ev.check_type}</span>
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Click <strong>Run now</strong> to check these events.</p>
          </div>
        )}
      </div>

      {/* Parameters — always shown */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-code" style={{ fontSize: 14, color: '#7c3aed' }} aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Parameters</span>
          {(paramChecks ?? []).length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              {(paramChecks ?? []).length} configured
            </span>
          )}
        </div>
        <div style={{ padding: '16px 18px' }}>
          {(paramChecks ?? []).length === 0 ? (
            <div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>No parameter checks configured.</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Go to <strong>Settings → Parameters</strong> to add event parameters to verify.</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
                Coverage = % of events where the parameter has a non-empty value. Compared week-over-week.
              </p>
              <ParameterCoveragePanel
                propertyId={p.ga4_property_id}
                parameterChecks={(paramChecks ?? []).map((pc: any) => ({ event_name: pc.event_name, parameter_name: pc.parameter_name }))}
                periodDays={periodDays}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
