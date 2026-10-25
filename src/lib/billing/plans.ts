// Purchasable subscription tiers — mirrors plan_project_limit() in
// supabase/migrations/011_billing.sql. "internal" (Bettersteps' own
// accounts, effectively unlimited) is a real plan_id value but isn't
// listed here since it's never shown or purchasable on /cennik.
export type BillingCycle = 'monthly' | 'yearly'

export interface Plan {
  id: 'lite' | 'pro' | 'agency'
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
  stripePriceId: Record<BillingCycle, string | undefined>
}

// id 'lite' was 'individual' until the rename in migration 033 — the env
// var names were renamed to match (STRIPE_PRICE_LITE_*) once the new
// Vercel env vars existed alongside the old ones, so there was no window
// where this plan's price was unavailable for purchase.
export const PLANS: Plan[] = [
  {
    id: 'lite',
    name: 'Lite',
    projectLimit: 3,
    priceMonthlyPLN: 29,
    // -30% off the annualized monthly price (29*12=348), rounded down so
    // the real discount is never less than advertised.
    priceYearlyPLN: 243,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_LITE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_LITE_YEARLY,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    projectLimit: 15,
    priceMonthlyPLN: 99,
    // -30% off 99*12=1188, rounded down.
    priceYearlyPLN: 831,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    projectLimit: 100,
    priceMonthlyPLN: 399,
    // -30% off 399*12=4788, rounded down.
    priceYearlyPLN: 3351,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
      yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY,
    },
  },
]

export function planById(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId)
}

export function planByStripePriceId(priceId: string): Plan | undefined {
  return PLANS.find(p => p.stripePriceId.monthly === priceId || p.stripePriceId.yearly === priceId)
}

export const TRIAL_DAYS = 14

export function planLimit(planId: string | null | undefined): number {
  if (planId === 'internal') return Number.MAX_SAFE_INTEGER
  if (planId === 'trial') return 15 // same ceiling as Pro — see supabase/migrations/032_trial_pro_terms.sql
  return PLANS.find(p => p.id === planId)?.projectLimit ?? 0
}

export function planName(planId: string | null | undefined): string {
  if (planId === 'internal') return 'Internal'
  if (planId === 'trial') return 'Trial (Pro)'
  return PLANS.find(p => p.id === planId)?.name ?? 'No plan'
}

// An expired trial should behave as no plan at all (matches
// effective_plan_id() in supabase/migrations/013_trial.sql) — profiles.plan_id
// itself is left as 'trial' after expiry as a historical record, so every
// place that reads it for limit/display purposes needs to resolve it first.
export function effectivePlanId(planId: string | null | undefined, trialEndsAt: string | null | undefined): string | null {
  if (planId === 'trial' && (!trialEndsAt || new Date(trialEndsAt) < new Date())) return null
  return planId ?? null
}

// Whether an account can use the product at all right now (as opposed to
// planLimit, which only says how many NEW projects it may create) — a
// project limit of 0 never stopped an account from continuing to pull live
// GA4 data or run daily checks on projects it already had, since none of
// that ever checked plan/trial status. This is that check, shared by the
// live GA4 routes and the worker so a lapsed trial actually stops
// functioning instead of only blocking new project creation.
export function hasActiveAccess(planId: string | null | undefined, trialEndsAt: string | null | undefined): boolean {
  return effectivePlanId(planId, trialEndsAt) !== null
}

// Max distinct addresses allowed in a project's alert_email or
// critical_alert_email list. Enforced here for the UI and again, identically,
// by the enforce_alert_email_limits() trigger in supabase/migrations/040 —
// a direct REST/SQL write must not be able to bypass this by skipping the UI.
export function alertEmailLimit(planId: string | null | undefined): number {
  if (planId === 'internal') return Number.MAX_SAFE_INTEGER
  if (planId === 'trial' || planId === 'pro' || planId === 'agency') return 5
  return 2 // lite, and any other/no plan
}

// Highest limit any purchasable plan actually has (Pro/Agency/Trial, see
// alertEmailLimit above) — once an account is already there, "upgrade" is
// meaningless since no plan offers more; point them at support instead.
const TOP_ALERT_EMAIL_LIMIT = 5

export function alertEmailLimitMessage(limit: number): string {
  const addrWord = `alert email${limit === 1 ? '' : 's'}`
  return limit >= TOP_ALERT_EMAIL_LIMIT
    ? `Your plan allows up to ${limit} ${addrWord} per project. Need more? Contact support.`
    : `Your plan allows up to ${limit} ${addrWord} per project. Upgrade to add more.`
}
