// Purchasable subscription tiers — mirrors plan_project_limit() in
// supabase/migrations/011_billing.sql. "internal" (Bettersteps' own
// accounts, effectively unlimited) is a real plan_id value but isn't
// listed here since it's never shown or purchasable on /cennik.
export type BillingCycle = 'monthly' | 'yearly'

export interface Plan {
  id: 'individual' | 'pro' | 'agency'
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
  stripePriceId: Record<BillingCycle, string | undefined>
}

export const PLANS: Plan[] = [
  {
    id: 'individual',
    name: 'Individual',
    projectLimit: 3,
    priceMonthlyPLN: 29,
    priceYearlyPLN: 290,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY,
      yearly: process.env.STRIPE_PRICE_INDIVIDUAL_YEARLY,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    projectLimit: 10,
    priceMonthlyPLN: 99,
    priceYearlyPLN: 990,
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
    priceYearlyPLN: 3990,
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

export function planLimit(planId: string | null | undefined): number {
  if (planId === 'internal') return Number.MAX_SAFE_INTEGER
  return PLANS.find(p => p.id === planId)?.projectLimit ?? 0
}

export function planName(planId: string | null | undefined): string {
  if (planId === 'internal') return 'Internal'
  return PLANS.find(p => p.id === planId)?.name ?? 'Brak planu'
}
