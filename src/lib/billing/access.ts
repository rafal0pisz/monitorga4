import { createAdminClient } from '@/lib/supabase/server'
import { hasActiveAccess } from './plans'

export const TRIAL_EXPIRED_MESSAGE = 'Your free trial has ended — upgrade to keep monitoring your GA4 properties.'

// Shared by every route that pulls live GA4 data or runs a check on behalf
// of a project owner — see hasActiveAccess for why this exists as its own
// check separate from planLimit.
export async function ownerHasActiveAccess(ownerId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', ownerId).single()
  return hasActiveAccess(profile?.plan_id, profile?.trial_ends_at)
}
