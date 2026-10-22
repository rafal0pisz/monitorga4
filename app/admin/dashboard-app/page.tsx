import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminGrowthChart from '@/components/admin/AdminGrowthChart'
import { fetchAllUsers, buildGrowthSeries } from '@/lib/admin/growthStats'
import { fetchAdminStats } from '@/lib/admin/businessStats'
import { effectivePlanId, planName } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'

const MAX_USERS_SHOWN = 50

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '18px 20px', flex: '1 1 160px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent ?? 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function AdoptionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
        <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{count} / {total} ({pct}%)</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: 'var(--color-background-tertiary)' }}>
        <div style={{ height: '100%', borderRadius: 3, backgroundColor: '#16a34a', width: `${pct}%` }} />
      </div>
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface BillingProfile {
  id: string
  plan_id: string | null
  trial_ends_at: string | null
  trial_used_at: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

interface LicenseInfo {
  plan: string
  type: 'No plan' | 'Trial' | 'Trial (expired)' | 'Subscription' | 'Internal'
  startedAt: string | null
  untilAt: string | null
  canceling: boolean
  active: boolean
}

// Always returns something to show — including "No plan" (signed up, never
// started a trial or bought a plan) and "Trial (expired)" (used their trial,
// never converted) — these are exactly the accounts worth seeing at a
// glance here, not ones to hide. `active` says whether the license is live
// right now (effectivePlanId's own notion of "usable today"). Subscription
// start isn't stored anywhere in our own schema (only the rolling
// current_period_end is) — it's read live from Stripe's subscription
// object instead of adding a column just for this admin-only display.
function licenseInfo(profile: BillingProfile | undefined, subscriptionStartedAt: Map<string, string>): LicenseInfo {
  if (!profile || !profile.plan_id) {
    return { plan: 'No plan', type: 'No plan', startedAt: null, untilAt: null, canceling: false, active: false }
  }

  const isTrial = profile.plan_id === 'trial'
  const isInternal = profile.plan_id === 'internal'
  const active = !!effectivePlanId(profile.plan_id, profile.trial_ends_at)
  const type: LicenseInfo['type'] = isTrial ? (active ? 'Trial' : 'Trial (expired)') : isInternal ? 'Internal' : 'Subscription'
  const startedAt = isTrial
    ? profile.trial_used_at
    : (profile.stripe_subscription_id && subscriptionStartedAt.get(profile.stripe_subscription_id)) || null
  const untilAt = isTrial ? profile.trial_ends_at : isInternal ? null : profile.current_period_end

  return { plan: planName(profile.plan_id), type, startedAt, untilAt, canceling: !!profile.cancel_at_period_end, active }
}

export default async function AdminDashboardPage() {
  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  if (!authData?.user) redirect('/login')

  if (!isAdminEmail(authData.user.email)) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access denied</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          This page is restricted to the AlertGA4 admin account.
        </p>
      </div>
    )
  }

  const admin = createAdminClient()

  const [users, { data: projectsRaw }, stats, { data: billingProfilesRaw }] = await Promise.all([
    fetchAllUsers(admin),
    admin.from('projects').select('created_at, status, owner_id'),
    fetchAdminStats(admin),
    admin.from('profiles').select('id, plan_id, trial_ends_at, trial_used_at, stripe_subscription_id, current_period_end, cancel_at_period_end'),
  ])

  const billingProfiles = (billingProfilesRaw ?? []) as BillingProfile[]
  const billingByUserId = new Map(billingProfiles.map(p => [p.id, p]))

  // Subscription start isn't persisted anywhere in our schema — fetched
  // live from Stripe per distinct subscription id. Promise.allSettled so
  // one bad/deleted-on-Stripe's-side id (e.g. stale test data) just shows
  // "—" for that one row instead of breaking the whole admin page.
  const paidSubscriptionIds = [...new Set(
    billingProfiles
      .filter(p => p.plan_id && p.plan_id !== 'trial' && p.plan_id !== 'internal' && p.stripe_subscription_id)
      .map(p => p.stripe_subscription_id as string)
  )]
  const subscriptionStartedAt = new Map<string, string>()
  if (paidSubscriptionIds.length > 0) {
    const stripe = getStripe()
    const results = await Promise.allSettled(paidSubscriptionIds.map(id => stripe.subscriptions.retrieve(id)))
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') subscriptionStartedAt.set(paidSubscriptionIds[i], new Date(r.value.created * 1000).toISOString())
    })
  }

  // "Active" here means data is actually being pulled for that project —
  // NOT just projects.status === 'active'. That column only tracks whether
  // the OWNER manually paused it; it's never flipped when a trial expires
  // or a subscription lapses (see app/api/stripe/webhook/route.ts's
  // customer.subscription.deleted handler, which explicitly leaves
  // existing projects' status alone). The actual gate that stops a project
  // from running is ownerHasActiveAccess() at request/worker time, which
  // depends on the OWNER's plan — so a project can sit at status='active'
  // in the DB while no check has run for it in weeks. A project only
  // counts as active below when both are true.
  function ownerHasLicense(ownerId: string | null): boolean {
    if (!ownerId) return false
    const profile = billingByUserId.get(ownerId)
    return !!effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
  }

  const projects = (projectsRaw ?? []) as { created_at: string; status: string; owner_id: string | null }[]
  const projectDates = projects.map(p => new Date(p.created_at))
  const activeCount = projects.filter(p => p.status === 'active' && ownerHasLicense(p.owner_id)).length
  const pausedCount = projects.filter(p => p.status === 'paused').length
  const blockedByBillingCount = projects.filter(p => p.status === 'active' && !ownerHasLicense(p.owner_id)).length

  // How many projects each user actually has data flowing for right now,
  // and how many sit at status='active' but are blocked anyway because the
  // owner has no usable license — both shown per-row in the Registered
  // users list below.
  const activeProjectCountByOwner = new Map<string, number>()
  const blockedProjectCountByOwner = new Map<string, number>()
  for (const p of projects) {
    if (p.status !== 'active' || !p.owner_id) continue
    const target = ownerHasLicense(p.owner_id) ? activeProjectCountByOwner : blockedProjectCountByOwner
    target.set(p.owner_id, (target.get(p.owner_id) ?? 0) + 1)
  }

  const userDates = users.map(u => new Date(u.created_at))
  const growth = buildGrowthSeries(userDates, projectDates)
  const totalUsers = users.length
  const activationPct = totalUsers > 0 ? Math.round((stats.usersWithProject / totalUsers) * 100) : 0
  const totalRuns30d = stats.workerRunsCompleted30d + stats.workerRunsFailed30d
  const successRatePct = totalRuns30d > 0 ? Math.round((stats.workerRunsCompleted30d / totalRuns30d) * 100) : null

  const usersByNewest = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>
      <nav style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Admin</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Business overview</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>Signups, projects, and growth — visible only to the AlertGA4 team.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <StatTile label="Registered users" value={totalUsers} />
          <StatTile label="Total projects" value={projects.length} />
          <StatTile label="Active projects (data flowing)" value={activeCount} accent="#16a34a" />
          <StatTile label="Paused projects" value={pausedCount} accent="#9ca3af" />
          <StatTile label="Blocked by billing" value={blockedByBillingCount} accent={blockedByBillingCount > 0 ? '#ea580c' : undefined} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <StatTile label="Activated users" value={`${stats.usersWithProject}/${totalUsers} (${activationPct}%)`} />
          <StatTile label="Avg. score (active)" value={stats.avgScore != null ? Math.round(stats.avgScore) : '—'} />
          <StatTile label="Median score (active)" value={stats.medianScore != null ? Math.round(stats.medianScore) : '—'} />
          <StatTile label="Worker success (30d)" value={successRatePct != null ? `${successRatePct}%` : '—'} accent={successRatePct != null && successRatePct < 90 ? '#dc2626' : undefined} />
          <StatTile label="Alerts sent (30d)" value={stats.alertsSent30d} />
          <StatTile label="Needs Google reconnect" value={stats.disconnectedOwners} accent={stats.disconnectedOwners > 0 ? '#ea580c' : undefined} />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Growth</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Cumulative users and projects over time</div>
          <AdminGrowthChart data={growth} />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Configuration adoption</div>
          <AdoptionRow label="Auto-run enabled" count={stats.autoRunEnabled} total={stats.totalActiveProjects} />
          <AdoptionRow label="Custom events" count={stats.customEventsAdoption} total={stats.totalActiveProjects} />
          <AdoptionRow label="Ecommerce checks" count={stats.ecommerceAdoption} total={stats.totalActiveProjects} />
          <AdoptionRow label="Parameter checks" count={stats.parametersAdoption} total={stats.totalActiveProjects} />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Registered users</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Newest first{usersByNewest.length > MAX_USERS_SHOWN ? ` — showing ${MAX_USERS_SHOWN} of ${usersByNewest.length}` : ''}
          </div>
          {usersByNewest.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No registered users yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {usersByNewest.slice(0, MAX_USERS_SHOWN).map(u => {
                const activeProjects = u.id ? activeProjectCountByOwner.get(u.id) ?? 0 : 0
                const blockedProjects = u.id ? blockedProjectCountByOwner.get(u.id) ?? 0 : 0
                const license = licenseInfo(u.id ? billingByUserId.get(u.id) : undefined, subscriptionStartedAt)
                const typeStyle = license.type === 'Trial'
                  ? { bg: '#fef9c3', color: '#92400e' }
                  : license.type === 'Trial (expired)'
                    ? { bg: '#fee2e2', color: '#991b1b' }
                    : license.type === 'Internal'
                      ? { bg: '#e5e7eb', color: '#374151' }
                      : license.type === 'No plan'
                        ? { bg: '#f3f4f6', color: '#6b7280' }
                        : { bg: '#dbeafe', color: '#1e3a8a' }
                return (
                  <div key={u.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-primary)' }}>{u.email ?? '—'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {activeProjects > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            {activeProjects} active — data flowing
                          </span>
                        )}
                        {blockedProjects > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
                            {blockedProjects} blocked — no license
                          </span>
                        )}
                        <span style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{fmtDate(u.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20, backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                        {license.plan}
                      </span>
                      <span>{license.type}</span>
                      {license.startedAt && <span>· Started {fmtDate(license.startedAt)}</span>}
                      {license.untilAt
                        ? <span>· Valid until {fmtDate(license.untilAt)}{license.canceling ? ' (canceling)' : ''}</span>
                        : license.type === 'Internal' && <span>· No expiry</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
