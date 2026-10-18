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

export default async function DashboardPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  // A team member sees every project under the Agency owner's account too,
  // not just ones they personally own — see src/lib/team/access.ts.
  const teamContext = !bypass && user ? await getTeamContext(user.id) : null
  let query = supabase.from('dashboard_projects').select('*').order('name')
  if (!bypass && user) query = query.in('owner_id', teamContext!.accessibleOwnerIds)
  const { data: projects, error: projectsError } = await query
  const list = (projects ?? []) as DashboardProject[]

  // Team membership only grants AlertGA4-side visibility — a project
  // shared via the team shows up in the list, but its actual data (score,
  // config status chips) stays hidden until the owner separately grants
  // this person's Google account access to the property itself. See
  // src/lib/ga4/memberAccess.ts.
  const memberPropertyIds = !bypass && user && teamContext?.isMember ? await getMemberAccessiblePropertyIds(user.id) : null
  const isLocked = (p: DashboardProject) => !!memberPropertyIds && p.owner_id !== user!.id && !memberPropertyIds.has(p.ga4_property_id)
  const visibleList = memberPropertyIds ? list.filter(p => !isLocked(p)) : list

  const avgScore = visibleList.length ? Math.round(visibleList.reduce((s, p) => s + (p.last_score ?? 0), 0) / visibleList.length) : null
  const critical = visibleList.filter(p => ['critical','warning'].includes(getScoreGrade(p.last_score))).length
  const dailyCheckCount = visibleList.filter(p => p.status === 'active' && !!p.auto_run).length
  const emailAlertCount = visibleList.filter(p => !!p.alert_email).length
  const hasAlertEmail = emailAlertCount > 0

  let limit: number | null = null
  let plan: string | null = null
  let onboardingDismissed = false
  // Plan/limit/onboarding state is always the ACCOUNT's (primaryOwnerId) —
  // for a pure team member that's the Agency owner's own profile, never
  // the member's own (plan-less) one, since billing and limits are the
  // owner's, not theirs. isMember also gates the "at limit" banner below:
  // a member can't act on an upgrade CTA anyway.
  const isMember = !!teamContext?.isMember
  if (!bypass && user) {
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('plan_id, trial_ends_at, onboarding_dismissed_at').eq('id', teamContext!.primaryOwnerId).single()
    if (!profileErr) {
      const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
      limit = planLimit(effective)
      plan = planName(effective)
      onboardingDismissed = isMember ? true : !!profile?.onboarding_dismissed_at
    }
  }
  const atLimit = !isMember && limit != null && list.length >= limit

  const hasFirstRun = list.some(p => p.last_score != null)
  const onboardingSteps = [
    { label: 'Add your first GA4 property', done: list.length > 0, href: '/dashboard/new' },
    { label: 'Run your first check manually', done: hasFirstRun, href: list[0] ? `/project/${list[0].id}` : undefined },
    { label: 'Set an alert email for it', done: hasAlertEmail, href: list[0] ? `/project/${list[0].id}/config` : undefined },
    { label: 'Get your first automated check', done: hasFirstRun },
  ]
  const showOnboarding = !bypass && !!user && !onboardingDismissed && onboardingSteps.some(s => !s.done)
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
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{list.length} monitored GA4 properties</p>
        </div>
        {plan && (
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>Plan: {plan}{isMember ? ' (team)' : ''}</span>
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
      {list.length > 0 && (
        <div className="dashboard-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 12, marginBottom: atLimit ? 12 : 28 }}>
          {[
            { label: 'Projects', value: limit != null && limit < Number.MAX_SAFE_INTEGER ? `${list.length} / ${limit}` : list.length, sub: 'monitored' },
            { label: 'Avg score', value: avgScore ?? '–', sub: 'all projects' },
            { label: 'Need attention', value: critical, sub: 'warning or critical' },
            { label: 'Daily check', value: `${dailyCheckCount} / ${visibleList.length}`, sub: 'enabled' },
            { label: 'Email alerts', value: `${emailAlertCount} / ${visibleList.length}`, sub: 'configured' },
          ].map(card => (
            <div key={card.label} className="dashboard-stat-card" style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px' }}>
              <p className="dashboard-stat-label" style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{card.label}</p>
              <p className="dashboard-stat-value" style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{card.value}</p>
              <p className="dashboard-stat-sub" style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}
      {atLimit && (
        <div style={{ background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 10, padding: '12px 16px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 12.5, color: '#9a3412', margin: 0 }}>You&apos;ve reached your plan&apos;s project limit ({limit}). Upgrade to add more.</p>
          <Link href="/cennik" style={{ fontSize: 12.5, color: '#9a3412', fontWeight: 500, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</Link>
        </div>
      )}
      {list.length === 0 ? (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--color-background-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none" aria-hidden="true">
              <rect x="0" y="10" width="6" height="12" rx="1.5" fill="var(--color-border-primary)" />
              <rect x="10" y="4" width="6" height="18" rx="1.5" fill="#16a34a" />
              <rect x="20" y="13" width="6" height="9" rx="1.5" fill="var(--color-border-primary)" />
            </svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>No projects yet</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Add your first GA4 property to start monitoring</p>
          <Link href="/dashboard/new" style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 500, padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>+ Add project</Link>
        </div>
      ) : (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>All projects</span>
            <Link href="/dashboard/new" style={{ fontSize: 12, color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>+ New project</Link>
          </div>
          {list.map((p, i) => {
            const locked = isLocked(p)
            const grade = getScoreGrade(p.last_score)
            const diff = p.last_score != null && p.prev_week_score != null ? Math.round(p.last_score - p.prev_week_score) : null
            const emailOn = !!p.alert_email
            const dailyOn = p.status === 'active' && !!p.auto_run
            return (
              <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block', borderBottom: i < list.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', opacity: locked ? 0.6 : 1 }}>
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
          })}
        </div>
      )}
      </>
      )}
    </div>
  )
}
