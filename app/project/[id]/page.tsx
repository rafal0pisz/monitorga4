import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PeriodSelector from '@/components/project/PeriodSelector'
import RunNowButton   from '@/components/project/RunNowButton'
import LiveChecksPanel from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import Link from 'next/link'

// ─── PALETTE ─────────────────────────────────────────────────────────────────

const C = {
  bg:        '#161B22',
  card:      '#1D2328',
  border:    '#2e3940',
  text:      '#e5e7eb',
  textMuted: '#6B7280',
  textSub:   '#9ca3af',
  green:     '#4ade80',
  amber:     '#fbbf24',
  red:       '#f87171',
  blue:      '#3b82f6',
  purple:    '#8b5cf6',
  cyan:      '#06b6d4',
  orange:    '#f97316',
}

// ─── CHECK SECTION MAPPING ───────────────────────────────────────────────────

const CHECK_SECTION: Record<string, string> = {
  // New live checks (Traffic / Engagement / Users) are rendered by LiveChecksPanel
  // Stored worker checks below:
  purchase_duplicates:  'ecommerce',
  ecommerce_events:     'ecommerce',
  custom_events:        'custom_events',
  parameter_checks:     'parameters',
}

const SECTION_META: Record<string, { label: string; accent: string }> = {
  ecommerce:    { label: 'Ecommerce',     accent: C.orange },
  custom_events:{ label: 'Custom Events', accent: C.amber  },
  parameters:   { label: 'Parameters',    accent: C.purple },
}

type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip'

const STATUS_COLOR: Record<CheckStatus, string> = {
  pass: C.green, warn: C.amber, fail: C.red, skip: C.textMuted,
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id }     = await params
  const { period } = await searchParams
  const periodDays = Number(period) || 7

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !user) redirect('/login')

  const admin = createAdminClient()

  // Fetch project
  const { data: project } = await admin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  // Fetch latest run
  const { data: latestRun } = await admin
    .from('dqs_runs')
    .select('*')
    .eq('project_id', id)
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch stored check results (for Ecommerce / Custom Events / Parameters)
  const { data: storedResults } = latestRun
    ? await admin
        .from('dqs_results')
        .select('*')
        .eq('run_id', latestRun.id)
    : { data: [] }

  // Group stored results by section (only non-live sections)
  const storedBySection: Record<string, any[]> = {
    ecommerce: [], custom_events: [], parameters: [],
  }
  for (const r of storedResults ?? []) {
    const sec = CHECK_SECTION[r.check_id]
    if (sec && storedBySection[sec]) storedBySection[sec].push(r)
  }

  // Ecommerce expected events for EventsDetailPanel
  const expectedEvents: string[] = project.expected_events ?? []

  const scoreColor = (s: number) => s >= 80 ? C.green : s >= 60 ? C.amber : C.red

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 20px',
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <span style={{ color: C.border }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{project.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PeriodSelector current={periodDays} />
            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Score header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              GA4 Property: <span style={{ color: C.textSub }}>{project.ga4_property_id}</span>
            </div>
            {latestRun && (
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Last run: {latestRun.run_date}
                {latestRun.status === 'failed' && (
                  <span style={{ color: C.red, marginLeft: 6 }}>· Failed</span>
                )}
              </div>
            )}
          </div>

          {latestRun?.score_total != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Overall Score</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(latestRun.score_total), lineHeight: 1 }}>
                {Math.round(latestRun.score_total)}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted }}>/ 100</div>
            </div>
          )}
        </div>

        {/* ── LIVE CHECKS: Traffic · Engagement · Users ───────────────────── */}
        {project.ga4_property_id ? (
          <LiveChecksPanel
            propertyId={project.ga4_property_id}
            period={periodDays}
          />
        ) : (
          <div style={{
            padding: 20, borderRadius: 10, marginBottom: 24,
            backgroundColor: '#78350f22', border: `1px solid #78350f`,
            fontSize: 13, color: C.amber,
          }}>
            No GA4 property configured. Edit project settings to add a property ID.
          </div>
        )}

        {/* ── STORED SECTIONS: Ecommerce · Custom Events · Parameters ─────── */}
        {(['ecommerce', 'custom_events', 'parameters'] as const).map(sectionId => {
          const meta   = SECTION_META[sectionId]
          const checks = storedBySection[sectionId]
          const isEmpty = checks.length === 0

          return (
            <div key={sectionId} style={{ marginBottom: 24 }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{meta.label}</span>
                </div>
                {!isEmpty && (
                  <span style={{
                    fontSize: 11, color: C.textMuted,
                  }}>
                    {checks.filter((c: any) => c.status === 'pass').length}/{checks.length} checks passed
                  </span>
                )}
              </div>

              {isEmpty ? (
                <div style={{
                  padding: '16px', borderRadius: 8, textAlign: 'center',
                  backgroundColor: '#ffffff05', border: `1px dashed ${C.border}`,
                  fontSize: 12, color: C.textMuted,
                }}>
                  {sectionId === 'ecommerce'
                    ? 'No ecommerce checks — configure in project settings.'
                    : sectionId === 'custom_events'
                    ? 'No custom events configured — add expected events in settings.'
                    : 'No parameter checks configured — set up in project settings.'}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 10,
                }}>
                  {checks.map((check: any) => (
                    <StoredCheckCard key={check.check_id} check={check} />
                  ))}
                </div>
              )}

              {/* Events chart panel (custom events only) */}
              {sectionId === 'custom_events' && expectedEvents.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <EventsDetailPanel
                    propertyId={project.ga4_property_id}
                    expectedEvents={expectedEvents}
                    periodDays={periodDays}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── STORED CHECK CARD (Ecommerce / Custom Events / Parameters) ──────────────

function StoredCheckCard({ check }: { check: any }) {
  const status: CheckStatus = check.status ?? 'skip'
  const col = STATUS_COLOR[status]

  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{check.check_id}</div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          padding: '2px 7px', borderRadius: 20, flexShrink: 0,
          color: col, backgroundColor: col + '22',
        }}>
          {status.toUpperCase()}
        </div>
      </div>
      {check.value != null && (
        <div style={{ fontSize: 20, fontWeight: 700, color: col, marginTop: 6, lineHeight: 1 }}>
          {typeof check.value === 'number' ? check.value.toFixed(1) : check.value}
        </div>
      )}
      {check.message && (
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, lineHeight: 1.4 }}>
          {check.message}
        </div>
      )}
    </div>
  )
}
