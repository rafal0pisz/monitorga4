import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PeriodSelector    from '@/components/project/PeriodSelector'
import RunNowButton      from '@/components/project/RunNowButton'
import LiveChecksPanel   from '@/components/project/LiveChecksPanel'
import EventsDetailPanel from '@/components/project/EventsDetailPanel'
import Link from 'next/link'

// Stored check sections (Ecommerce / Custom Events / Parameters)
const CHECK_SECTION: Record<string, 'ecommerce' | 'custom_events' | 'parameters'> = {
  purchase_duplicates: 'ecommerce',
  ecommerce_events:    'ecommerce',
  custom_events:       'custom_events',
  parameter_checks:    'parameters',
}

const SECTION_META = {
  ecommerce:     { label: 'Ecommerce',     accent: '#f97316' },
  custom_events: { label: 'Custom Events', accent: '#ca8a04' },
  parameters:    { label: 'Parameters',    accent: '#8b5cf6' },
} as const

// Status display
type CheckStatus = 'pass' | 'warn' | 'check' | 'fail' | 'skip'
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pass:  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass'  },
  warn:  { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', label: 'Warn'  },
  check: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Check' },
  fail:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Check' }, // legacy
  skip:  { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', label: 'Skip'  },
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
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

  const { data: project } = await admin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: latestRun } = await admin
    .from('dqs_runs')
    .select('*')
    .eq('project_id', id)
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: storedResults } = latestRun
    ? await admin.from('dqs_results').select('*').eq('run_id', latestRun.id)
    : { data: [] }

  const storedBySection: Record<string, any[]> = {
    ecommerce: [], custom_events: [], parameters: [],
  }
  for (const r of storedResults ?? []) {
    const sec = CHECK_SECTION[r.check_id]
    if (sec) storedBySection[sec].push(r)
  }

  const expectedEvents: string[] = project.expected_events ?? []

  const scoreColor = (s: number) =>
    s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : '#dc2626'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background-tertiary)',
      color: 'var(--color-text-primary)',
    }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: 'var(--color-background-secondary)',
        borderBottom: '1px solid var(--color-border-tertiary)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 20px',
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" style={{
              fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none',
            }}>
              ← Dashboard
            </Link>
            <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {project.name}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PeriodSelector current={periodDays} />

            <Link
              href={`/project/${id}/config`}
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid var(--color-border-tertiary)',
                backgroundColor: 'var(--color-background-primary)',
              }}
            >
              ⚙ Settings
            </Link>

            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Score + property info */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 28,
          padding: '16px 20px',
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              GA4 Property:&nbsp;
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                {project.ga4_property_id || '—'}
              </span>
            </div>
            {latestRun && (
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Last run: {latestRun.run_date}
                {latestRun.status === 'failed' && (
                  <span style={{ color: '#dc2626', marginLeft: 8 }}>· Run failed</span>
                )}
              </div>
            )}
            {!latestRun && (
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                No runs yet — click <strong>Run now</strong> to start.
              </div>
            )}
          </div>

          {latestRun?.score_total != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 10, color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>
                Overall Score
              </div>
              <div style={{
                fontSize: 38, fontWeight: 800, lineHeight: 1,
                color: scoreColor(latestRun.score_total),
              }}>
                {Math.round(latestRun.score_total)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>/ 100</div>
            </div>
          )}
        </div>

        {/* ── LIVE: Traffic · Engagement · Users ──────────────────────────── */}
        {project.ga4_property_id ? (
          <LiveChecksPanel propertyId={project.ga4_property_id} period={periodDays} />
        ) : (
          <div style={{
            padding: '14px 16px', borderRadius: 10, marginBottom: 24,
            backgroundColor: '#fefce8', border: '1px solid #fef08a',
            fontSize: 13, color: '#92400e',
          }}>
            No GA4 property configured.{' '}
            <Link href={`/project/${id}/config`} style={{ color: '#16a34a', fontWeight: 500 }}>
              Open Settings →
            </Link>
          </div>
        )}

        {/* ── STORED: Ecommerce · Custom Events · Parameters ──────────────── */}
        {(['ecommerce', 'custom_events', 'parameters'] as const).map(sectionId => {
          const meta    = SECTION_META[sectionId]
          const checks  = storedBySection[sectionId]
          const isEmpty = checks.length === 0

          const emptyMsg = {
            ecommerce:     'No ecommerce checks — configure in project settings.',
            custom_events: 'No custom events configured — add expected events in settings.',
            parameters:    'No parameter checks configured — set up in project settings.',
          }[sectionId]

          return (
            <div key={sectionId} style={{ marginBottom: 28 }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, paddingBottom: 8,
                borderBottom: '1px solid var(--color-border-tertiary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {meta.label}
                  </span>
                </div>
                {!isEmpty && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {checks.filter((c: any) => c.status === 'pass').length}/{checks.length} passed
                  </span>
                )}
              </div>

              {isEmpty ? (
                <div style={{
                  padding: '14px 16px', borderRadius: 8, textAlign: 'center',
                  backgroundColor: 'var(--color-background-primary)',
                  border: '1px dashed var(--color-border-tertiary)',
                  fontSize: 12, color: 'var(--color-text-secondary)',
                }}>
                  {emptyMsg}
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

              {/* Charts only for Custom Events */}
              {sectionId === 'custom_events' && expectedEvents.length > 0 && (
                <div style={{ marginTop: 14 }}>
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

// ─── STORED CHECK CARD ───────────────────────────────────────────────────────

function StoredCheckCard({ check }: { check: any }) {
  const st = STATUS_STYLE[check.status ?? 'skip'] ?? STATUS_STYLE.skip

  return (
    <div style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {check.check_id}
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          padding: '2px 8px', borderRadius: 20, flexShrink: 0,
          color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`,
        }}>
          {st.label}
        </div>
      </div>
      {check.value != null && (
        <div style={{ fontSize: 20, fontWeight: 700, color: st.color, marginTop: 6, lineHeight: 1 }}>
          {typeof check.value === 'number' ? check.value.toFixed(1) : check.value}
        </div>
      )}
      {check.message && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 5, lineHeight: 1.4 }}>
          {check.message}
        </div>
      )}
    </div>
  )
}
