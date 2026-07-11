import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { DashboardProject } from '@/types'
import { getScoreGrade, SCORE_GRADE_STYLE as G } from '@/types'
import { planLimit, planName, effectivePlanId } from '@/lib/billing/plans'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import Link from 'next/link'
export default async function DashboardPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let query = supabase.from('dashboard_projects').select('*').order('name')
  if (!bypass && user) query = query.eq('owner_id', user.id)
  const { data: projects } = await query
  const list = (projects ?? []) as DashboardProject[]
  const avgScore = list.length ? Math.round(list.reduce((s, p) => s + (p.last_score ?? 0), 0) / list.length) : null
  const critical = list.filter(p => ['critical','warning'].includes(getScoreGrade(p.last_score))).length

  let limit: number | null = null
  let plan: string | null = null
  let onboardingDismissed = false
  let hasAlertEmail = false
  if (!bypass && user) {
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('plan_id, trial_ends_at, onboarding_dismissed_at').eq('id', user.id).single()
    if (!profileErr) {
      const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
      limit = planLimit(effective)
      plan = planName(effective)
      onboardingDismissed = !!profile?.onboarding_dismissed_at
    }

    const { data: emailRows } = await supabase.from('projects').select('alert_email').eq('owner_id', user.id)
    hasAlertEmail = (emailRows ?? []).some((r: { alert_email: string | null }) => !!r.alert_email)
  }
  const atLimit = limit != null && list.length >= limit

  const onboardingSteps = [
    { label: 'Add your first GA4 property', done: list.length > 0, href: '/dashboard/new' },
    { label: 'Set an alert email for it', done: hasAlertEmail, href: list[0] ? `/project/${list[0].id}/config` : undefined },
    { label: 'Get your first automated check', done: list.some(p => p.last_score != null) },
  ]
  const showOnboarding = !bypass && !!user && !onboardingDismissed && onboardingSteps.some(s => !s.done)
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{list.length} monitored GA4 properties</p>
        </div>
        {plan && (
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>Plan: {plan}</span>
        )}
      </div>
      {showOnboarding && <OnboardingChecklist steps={onboardingSteps} />}
      {list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: atLimit ? 12 : 28 }}>
          {[
            { label: 'Projects', value: limit != null && limit < Number.MAX_SAFE_INTEGER ? `${list.length} / ${limit}` : list.length, sub: 'monitored' },
            { label: 'Avg score', value: avgScore ?? '–', sub: 'all projects' },
            { label: 'Need attention', value: critical, sub: 'warning or critical' },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{card.label}</p>
              <p style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>{card.sub}</p>
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
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>📊</p>
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
            const grade = getScoreGrade(p.last_score)
            const diff = p.last_score != null && p.prev_week_score != null ? Math.round(p.last_score - p.prev_week_score) : null
            return (
              <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px', borderBottom: i < list.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: G[grade].color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 1px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 11, margin: 0, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.ga4_property_id}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {diff !== null && <span style={{ fontSize: 11, color: diff >= 0 ? '#16a34a' : '#dc2626' }}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: G[grade].bg, border: `0.5px solid ${G[grade].border}`, borderRadius: 6, padding: '3px 10px' }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: G[grade].color, lineHeight: 1 }}>{p.last_score != null ? Math.round(p.last_score) : '–'}</span>
                      <span style={{ fontSize: 11, color: G[grade].color }}>{G[grade].label}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
