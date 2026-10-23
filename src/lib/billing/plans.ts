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
    priceMonthlyPLN: 39,
    // -30% off the annualized monthly price (39*12=468), rounded down so
    // the real discount is never less than advertised.
    priceYearlyPLN: 327,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_LITE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_LITE_YEARLY,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    projectLimit: 15,
    priceMonthlyPLN: 139,
    // -30% off 139*12=1668, rounded down.
    priceYearlyPLN: 1167,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    projectLimit: 100,
    priceMonthlyPLN: 499,
    // -30% off 499*12=5988, rounded down.
    priceYearlyPLN: 4191,
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
