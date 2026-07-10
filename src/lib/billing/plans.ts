// Purchasable subscription tiers — mirrors plan_project_limit() in
// supabase/migrations/011_billing.sql. "internal" (Bettersteps' own
// accounts, effectively unlimited) is a real plan_id value but isn't
// listed here since it's never shown or purchasable on /cennik.
export interface Plan {
  id: 'individual' | 'pro' | 'agency'
  name: string
  projectLimit: number
}

export const PLANS: Plan[] = [
  { id: 'individual', name: 'Individual', projectLimit: 3 },
  { id: 'pro', name: 'Pro', projectLimit: 10 },
  { id: 'agency', name: 'Agency', projectLimit: 100 },
]

export function planLimit(planId: string | null | undefined): number {
  if (planId === 'internal') return Number.MAX_SAFE_INTEGER
  return PLANS.find(p => p.id === planId)?.projectLimit ?? 0
}

export function planName(planId: string | null | undefined): string {
  if (planId === 'internal') return 'Internal'
  return PLANS.find(p => p.id === planId)?.name ?? 'Brak planu'
}
