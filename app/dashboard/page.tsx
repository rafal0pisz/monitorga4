import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { CSSProperties } from 'react'
import type { DashboardProject } from '@/types'
import { getScoreGrade, SCORE_GRADE_STYLE as G } from '@/types'
import { planLimit, planName, effectivePlanId } from '@/lib/billing/plans'
import { getTeamContext } from '@/lib/team/access'
import { getMemberAccessiblePropertyIds } from '@/lib/ga4/memberAccess'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import Link from 'next/link'

// Small on/off status chip used in the "All projects" list (e.g. Email,
// Daily) — green when on, muted when off.
function statusChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px 2.5px 7px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}
function chipDotStyle(on: boolean): CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: on ? '#16a34a' : 'var(--color-text-tertiary)' }
}
// Small count chip (E-com / Events / Params) — green once configured (count >
// 0), same as the Email/Daily status chips. This only reflects whether
// something was configured, not whether it's healthy at scale — hence the
// "Conf." label placed to the left of this chip group.
function countChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}
function countValueStyle(on: boolean): CSSProperties {
  return { fontFamily: 'var(--font-mono)', fontWeight: 700, color: on ? '#166534' : 'var(--color-text-primary)' }
}

function StatGrid({ stats, marginBottom }: { stats: { label: string; value: string | number; sub: string }[]; marginBottom: number }) {
  return (
    <div className="dashboard-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 12, marginBottom }}>
      {stats.map(card => (
        <div key={card.label} className="dashboard-stat-card" style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px' }}>
          <p className="dashboard-stat-label" style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{card.label}</p>
          <p className="dashboard-stat-value" style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{card.value}</p>
          <p className="dashboard-stat-sub" style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>{card.sub}</p>
        </div>
      ))}
    </div>
  )
}

function ProjectRow({ p, locked, isLast }: { p: DashboardProject; locked: boolean; isLast: boolean }) {
  const grade = getScoreGrade(p.last_score)
  const diff = p.last_score != null && p.prev_week_score != null ? Math.round(p.last_score - p.prev_week_score) : null
  const emailOn = !!p.alert_email
  const dailyOn = p.status === 'active' && !!p.auto_run
  return (
    <Link href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border-tertiary)', opacity: locked ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px 4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: locked ? 'var(--color-text-tertiary)' : G[grade].color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 1px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
          <p style={{ fontSize: 11, margin: 0, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{locked ? 'No GA4 access' : p.ga4_property_id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {locked ? (
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>🔒 Locked</span>
          ) : (
            <>
              {diff !== null && <span style={{ fontSize: 11, color: diff >= 0 ? '#16a34a' : '#dc2626' }}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: G[grade].bg, border: `0.5px solid ${G[grade].border}`, borderRadius: 6, padding: '3px 10px' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: G[grade].color, lineHeight: 1 }}>{p.last_score != null ? Math.round(p.last_score) : '–'}</span>
                <span style={{ fontSize: 11, color: G[grade].color }}>{G[grade].label}</span>
              </div>
            </>
          )}
        </div>
      </div>
      {!locked && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '0 20px 12px 42px' }}>
          <span style={statusChipStyle(emailOn)}><span style={chipDotStyle(emailOn)} />Email</span>
          <span style={statusChipStyle(dailyOn)}><span style={chipDotStyle(dailyOn)} />Daily</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>Conf.</span>
          <span style={countChipStyle(p.ecommerce_events_count > 0)}>E-com <b style={countValueStyle(p.ecommerce_events_count > 0)}>{p.ecommerce_events_count}</b></span>
          <span style={countChipStyle(p.custom_events_count > 0)}>Events <b style={countValueStyle(p.custom_events_count > 0)}>{p.custom_events_count}</b></span>
          <span style={countChipStyle(p.parameter_checks_count > 0)}>Params <b style={countValueStyle(p.parameter_checks_count > 0)}>{p.parameter_checks_count}</b></span>
        </div>
      )}
    </Link>
  )
}

function ProjectListCard({ title, action, projects, lockedIds }: { title: string; action?: React.ReactNode; projects: DashboardProject[]; lockedIds: Set<string> }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
        {action}
      </div>
      {projects.map((p, i) => (
        <ProjectRow key={p.id} p={p} locked={lockedIds.has(p.id)} isLast={i === projects.length - 1} />
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  // "Own" (owner_id = you) and "Team" (owner_id = an Agency account you've
  // been added to) are two independent contexts — having one never affects
  // the other. See src/lib/team/access.ts.
  const teamContext = !bypass && user ? await getTeamContext(user.id) : null
  let query = supabase.from('dashboard_projects').select('*').order('name')
  if (!bypass && user) query = query.in('owner_id', teamContext!.accessibleOwnerIds)
  const { data: projects, error: projectsError } = await query
  const allList = (projects ?? []) as DashboardProject[]
  const ownList = !bypass && user ? allList.filter(p => p.owner_id === user.id) : allList
  const teamList = !bypass && user ? allList.filter(p => p.owner_id !== user.id) : []

  // Team membership only grants AlertGA4-side visibility — a shared
  // project shows up in the Team list, but its actual data (score, config
  // status chips) stays locked until the owner separately grants this
  // person's Google account access to the property itself. Never applies
  // to your own projects — that's your own Google connection regardless of
  // any team. See src/lib/ga4/memberAccess.ts.
  const memberPropertyIds = !bypass && user && teamList.length > 0 ? await getMemberAccessiblePropertyIds(user.id) : null
  const lockedTeamIds = new Set(
    memberPropertyIds ? teamList.filter(p => !memberPropertyIds.has(p.ga4_property_id)).map(p => p.id) : []
  )
  const unlockedTeamList = teamList.filter(p => !lockedTeamIds.has(p.id))

  // Your own plan/limit — entirely your own, unaffected by any team you're
  // also on.
  let ownLimit: number | null = null
  let ownPlan: string | null = null
  let onboardingDismissed = false
  if (!bypass && user) {
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('plan_id, trial_ends_at, onboarding_dismissed_at').eq('id', user.id).single()
    if (!profileErr) {
      const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
      ownLimit = planLimit(effective)
      ownPlan = planName(effective)
      onboardingDismissed = !!profile?.onboarding_dismissed_at
    }
  }
  const ownAtLimit = ownLimit != null && ownList.length >= ownLimit

  const hasFirstRun = ownList.some(p => p.last_score != null)
  const onboardingSteps = [
    { label: 'Add your first GA4 property', done: ownList.length > 0, href: '/dashboard/new' },
    { label: 'Run your first check manually', done: hasFirstRun, href: ownList[0] ? `/project/${ownList[0].id}` : undefined },
    { label: 'Set an alert email for it', done: ownList.some(p => !!p.alert_email), href: ownList[0] ? `/project/${ownList[0].id}/config` : undefined },
    { label: 'Get your first automated check', done: hasFirstRun },
  ]
  const showOnboarding = !bypass && !!user && !onboardingDismissed && onboardingSteps.some(s => !s.done)

  const teamOwnerEmail = teamList.length > 0 && teamContext?.teamOwnerId
    ? (await supabase.auth.admin.getUserById(teamContext.teamOwnerId)).data.user?.email ?? null
    : null

  return (
    <div style={{ maxWidth: 700 }}>
      <style>{`
        @media (max-width: 560px) {
          /* 3 compact tiles per row instead of stacking one per row — plenty
             of room for short label/number/sub content at this size. */
          .dashboard-stat-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .dashboard-stat-card { padding: 8px 6px !important; }
          .dashboard-stat-label { font-size: 9.5px !important; margin-bottom: 2px !important; }
          .dashboard-stat-value { font-size: 19px !important; }
          .dashboard-stat-sub { font-size: 9.5px !important; }
        }
      `}</style>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{allList.length} monitored GA4 properties</p>
        </div>
        {ownPlan && (
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>Plan: {ownPlan}</span>
        )}
      </div>
      {projectsError ? (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: '0 0 4px' }}>Couldn&apos;t load your projects</p>
          <p style={{ fontSize: 12.5, color: '#991b1b', margin: 0 }}>
            Something went wrong loading your data just now — this is a loading error, not an empty account, and your projects are not affected. Please refresh the page; if this keeps happening, contact{' '}
            <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#991b1b', textDecoration: 'underline' }}>kontakt@bettersteps.pl</a>.
          </p>
        </div>
      ) : (
        <>
          {showOnboarding && <OnboardingChecklist steps={onboardingSteps} />}

          {/* ── YOUR PROJECTS ─────────────────────────────────────────── */}
          {ownList.length > 0 && (
            <StatGrid
              marginBottom={ownAtLimit ? 12 : 20}
              stats={[
                { label: 'Projects', value: ownLimit != null && ownLimit < Number.MAX_SAFE_INTEGER ? `${ownList.length} / ${ownLimit}` : ownList.length, sub: 'monitored' },
                { label: 'Avg score', value: ownList.length ? Math.round(ownList.reduce((s, p) => s + (p.last_score ?? 0), 0) / ownList.length) : '–', sub: 'your projects' },
                { label: 'Need attention', value: ownList.filter(p => ['critical', 'warning'].includes(getScoreGrade(p.last_score))).length, sub: 'warning or critical' },
                { label: 'Daily check', value: `${ownList.filter(p => p.status === 'active' && !!p.auto_run).length} / ${ownList.length}`, sub: 'enabled' },
                { label: 'Email alerts', value: `${ownList.filter(p => !!p.alert_email).length} / ${ownList.length}`, sub: 'configured' },
              ]}
            />
          )}
          {ownAtLimit && (
            <div style={{ background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 12.5, color: '#9a3412', margin: 0 }}>You&apos;ve reached your plan&apos;s project limit ({ownLimit}). Upgrade to add more.</p>
              <Link href="/cennik" style={{ fontSize: 12.5, color: '#9a3412', fontWeight: 500, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</Link>
            </div>
          )}
          {ownList.length === 0 ? (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '48px 24px', textAlign: 'center', marginBottom: teamList.length > 0 ? 28 : 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--color-background-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="22" viewBox="0 0 26 22" fill="none" aria-hidden="true">
                  <rect x="0" y="10" width="6" height="12" rx="1.5" fill="var(--color-border-primary)" />
                  <rect x="10" y="4" width="6" height="18" rx="1.5" fill="#16a34a" />
                  <rect x="20" y="13" width="6" height="9" rx="1.5" fill="var(--color-border-primary)" />
                </svg>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>No projects of your own yet</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Add your first GA4 property to start monitoring</p>
              <Link href="/dashboard/new" style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 500, padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>+ Add project</Link>
            </div>
          ) : (
            <div style={{ marginBottom: teamList.length > 0 ? 28 : 0 }}>
              <ProjectListCard
                title="Your projects"
                action={<Link href="/dashboard/new" style={{ fontSize: 12, color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>+ New project</Link>}
                projects={ownList}
                lockedIds={new Set()}
              />
            </div>
          )}

          {/* ── TEAM PROJECTS ─────────────────────────────────────────── */}
          {teamList.length > 0 && (
            <>
              <StatGrid
                marginBottom={12}
                stats={[
                  { label: 'Team projects', value: teamList.length, sub: teamOwnerEmail ?? 'shared with you' },
                  { label: 'Accessible', value: unlockedTeamList.length, sub: 'you have GA4 access' },
                  { label: 'Avg score', value: unlockedTeamList.length ? Math.round(unlockedTeamList.reduce((s, p) => s + (p.last_score ?? 0), 0) / unlockedTeamList.length) : '–', sub: 'accessible projects' },
                ]}
              />
              <ProjectListCard
                title={teamOwnerEmail ? `${teamOwnerEmail}'s team` : 'Team projects'}
                projects={teamList}
                lockedIds={lockedTeamIds}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
