import NewProjectForm from '@/components/project/NewProjectForm'
import StartTrialButton from '@/components/billing/StartTrialButton'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, planLimit, TRIAL_DAYS } from '@/lib/billing/plans'
import Link from 'next/link'

export default async function NewProjectPage() {
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  // Gate checked up front, before the wizard renders at all — previously
  // this only surfaced as a "PLAN_LIMIT_REACHED" error from create_project
  // at the very last step, after a user had already filled in custom
  // events/ecommerce/parameters. A brand-new account (plan_id = null,
  // trial never started) has a project limit of 0, so without this gate
  // every new signup would hit that dead end on their very first project.
  let canCreate = true
  let canStartTrial = false
  let limit = 0

  if (!bypass) {
    const user = await getAuthUser()
    if (user) {
      const admin = createAdminClient()
      const [{ data: profile }, { count }] = await Promise.all([
        admin.from('profiles').select('plan_id, trial_ends_at, trial_used_at').eq('id', user.id).single(),
        admin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      ])
      const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
      limit = planLimit(effective)
      canCreate = (count ?? 0) < limit
      canStartTrial = !effective && !profile?.trial_used_at
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', gap: 6 }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>New project</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>New project</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 28px' }}>Connect a GA4 property to the quality monitor</p>

      {!canCreate ? (
        canStartTrial ? (
          <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#166534', margin: '0 0 10px' }}>
              You don&apos;t have a paid plan yet, so you can&apos;t create a project. Start your free {TRIAL_DAYS}-day trial on Agency terms (up to 100 GA4 properties) — no card required, one-time only.
            </p>
            <StartTrialButton label={`Start ${TRIAL_DAYS}-day free trial`} lang="en" />
          </div>
        ) : (
          <div style={{ background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12.5, color: '#9a3412', margin: 0 }}>You&apos;ve reached your plan&apos;s project limit ({limit}). Upgrade to add more.</p>
            <Link href="/cennik" style={{ fontSize: 12.5, color: '#9a3412', fontWeight: 500, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</Link>
          </div>
        )
      ) : (
        <NewProjectForm />
      )}
    </div>
  )
}
