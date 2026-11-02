import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllUsers } from './growthStats'
import { effectivePlanId, planName } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'

export interface BillingProfile {
  id: string
  plan_id: string | null
  trial_ends_at: string | null
  trial_used_at: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

export interface LicenseInfo {
  plan: string
  type: 'No plan' | 'Trial' | 'Trial (expired)' | 'Subscription' | 'Internal' | 'Member'
  startedAt: string | null
  untilAt: string | null
  canceling: boolean
  active: boolean
}

export interface TeamMembership {
  ownerId: string
  acceptedAt: string | null
}

export interface RegisteredUserRow {
  id: string
  email: string | null
  createdAt: string
  activeProjects: number
  blockedProjects: number
  license: LicenseInfo
  // Populated whenever this user is an accepted member of ANOTHER owner's
  // team — independent of `license`, which reflects only their OWN billing.
  // Someone can have their own paid plan and still be an accepted member
  // elsewhere (e.g. a freelancer with their own account who also helps run
  // an agency client's Agency-plan team); this surfaces that second
  // relationship instead of hiding it behind whichever plan `license` shows.
  teamOwnerEmail: string | null
}

export interface ProjectRow {
  created_at: string
  status: string
  owner_id: string | null
}

export interface RegisteredUsersData {
  rows: RegisteredUserRow[] // every user, newest first — callers slice for display
  projects: ProjectRow[]
  activeCount: number
  pausedCount: number
  blockedByBillingCount: number
}

// Always returns something to show — including "No plan" (signed up, never
// started a trial or bought a plan) and "Trial (expired)" (used their trial,
// never converted) — these are exactly the accounts worth seeing at a
// glance, not ones to hide. `active` says whether the license is live right
// now (effectivePlanId's own notion of "usable today"). Subscription start
// isn't stored anywhere in our own schema (only the rolling
// current_period_end is) — it's read live from Stripe's subscription
// object instead of adding a column just for this admin-only display.
//
// An invited team member never gets their own plan_id (they ride on the
// Agency owner's subscription), so without `membership` they'd fall through
// to "No plan" here — indistinguishable from someone who just signed up and
// never started a trial. `membership` disambiguates that case.
function licenseInfo(
  profile: BillingProfile | undefined,
  subscriptionStartedAt: Map<string, string>,
  membership: TeamMembership | undefined,
  billingByUserId: Map<string, BillingProfile>,
): LicenseInfo {
  if (!profile || !profile.plan_id) {
    if (membership) {
      const ownerProfile = billingByUserId.get(membership.ownerId)
      const active = !!effectivePlanId(ownerProfile?.plan_id, ownerProfile?.trial_ends_at)
      return { plan: 'Member', type: 'Member', startedAt: membership.acceptedAt, untilAt: null, canceling: false, active }
    }
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

// Single source of truth for "Registered users" — used by both the admin
// dashboard page and the CSV export route, so the two can never drift into
// showing different numbers for the same account.
export async function fetchRegisteredUsersData(admin: ReturnType<typeof createAdminClient>): Promise<RegisteredUsersData> {
  const [users, { data: projectsRaw }, { data: billingProfilesRaw }, { data: teamMembersRaw }] = await Promise.all([
    fetchAllUsers(admin),
    admin.from('projects').select('created_at, status, owner_id'),
    admin.from('profiles').select('id, plan_id, trial_ends_at, trial_used_at, stripe_subscription_id, current_period_end, cancel_at_period_end'),
    admin.from('team_members').select('member_id, owner_id, accepted_at').not('accepted_at', 'is', null),
  ])

  const billingProfiles = (billingProfilesRaw ?? []) as BillingProfile[]
  const billingByUserId = new Map(billingProfiles.map(p => [p.id, p]))

  // v1 constraint (see src/lib/team/access.ts): a person belongs to at most
  // one team — safe to key by member_id without worrying about overwrites.
  const membershipByMemberId = new Map<string, TeamMembership>(
    ((teamMembersRaw ?? []) as { member_id: string | null; owner_id: string; accepted_at: string | null }[])
      .filter((tm): tm is { member_id: string; owner_id: string; accepted_at: string | null } => !!tm.member_id)
      .map(tm => [tm.member_id, { ownerId: tm.owner_id, acceptedAt: tm.accepted_at }])
  )

  // Subscription start isn't persisted anywhere in our schema — fetched
  // live from Stripe per distinct subscription id. Promise.allSettled so
  // one bad/deleted-on-Stripe's-side id (e.g. stale test data) just shows
  // no start date for that one row instead of breaking the whole export.
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

  // "Active" means data is actually being pulled for that project — NOT
  // just projects.status === 'active'. That column only tracks whether the
  // OWNER manually paused it; it's never flipped when a trial expires or a
  // subscription lapses (see app/api/stripe/webhook/route.ts's
  // customer.subscription.deleted handler, which explicitly leaves
  // existing projects' status alone). The actual gate that stops a project
  // from running is ownerHasActiveAccess() at request/worker time, which
  // depends on the OWNER's plan — so a project can sit at status='active'
  // in the DB while no check has run for it in weeks.
  function ownerHasLicense(ownerId: string | null): boolean {
    if (!ownerId) return false
    const profile = billingByUserId.get(ownerId)
    return !!effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
  }

  const projects = (projectsRaw ?? []) as ProjectRow[]
  const activeCount = projects.filter(p => p.status === 'active' && ownerHasLicense(p.owner_id)).length
  const pausedCount = projects.filter(p => p.status === 'paused').length
  const blockedByBillingCount = projects.filter(p => p.status === 'active' && !ownerHasLicense(p.owner_id)).length

  const activeProjectCountByOwner = new Map<string, number>()
  const blockedProjectCountByOwner = new Map<string, number>()
  for (const p of projects) {
    if (p.status !== 'active' || !p.owner_id) continue
    const target = ownerHasLicense(p.owner_id) ? activeProjectCountByOwner : blockedProjectCountByOwner
    target.set(p.owner_id, (target.get(p.owner_id) ?? 0) + 1)
  }

  const emailByUserId = new Map(users.map(u => [u.id, u.email]))

  const rows: RegisteredUserRow[] = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(u => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      teamOwnerEmail: (() => {
        const m = membershipByMemberId.get(u.id)
        return m ? emailByUserId.get(m.ownerId) ?? null : null
      })(),
      activeProjects: activeProjectCountByOwner.get(u.id) ?? 0,
      blockedProjects: blockedProjectCountByOwner.get(u.id) ?? 0,
      license: licenseInfo(billingByUserId.get(u.id), subscriptionStartedAt, membershipByMemberId.get(u.id), billingByUserId),
    }))

  return { rows, projects, activeCount, pausedCount, blockedByBillingCount }
}
