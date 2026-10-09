import { createAdminClient } from '@/lib/supabase/server'
import { hasActiveAccess } from './plans'

export const TRIAL_EXPIRED_MESSAGE = 'Your free trial has ended — upgrade to keep monitoring your GA4 properties.'

// Shared by every route that pulls live GA4 data or runs a check on behalf
// of a project owner — see hasActiveAccess for why this exists as its own
// check separate from planLimit.
export async function ownerHasActiveAccess(ownerId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: profile, error } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', ownerId).single()
  if (error) {
    // Fail OPEN: a transient lookup failure must never present as "your
    // trial has ended" to a paying customer. Worse case this lets a
    // genuinely lapsed account through for one request — far better than
    // locking out active, paying users over an unrelated query blip.
    console.error('[ownerHasActiveAccess] Profile lookup failed — allowing access:', error.message)
    return true
  }
  return hasActiveAccess(profile?.plan_id, profile?.trial_ends_at)
}
