import { createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { randomBytes } from 'crypto'

const COUPON_ID = 'TRIAL_WINBACK_30'
const COUPON_PERCENT_OFF = 30
const PROMO_CODE_VALID_DAYS = 14

// Idempotent — the coupon is a shared discount DEFINITION (30% off the
// first invoice, whichever billing cycle the customer picks), reused by
// every win-back send; only created once, on first use. This is a
// deliberate, narrow exception to the convention in
// app/api/stripe/checkout/route.ts ("coupons/promotion codes are created
// and managed directly in the Stripe Dashboard, not in this app") — that
// convention fits a human picking a promo for /cennik, but a win-back code
// whose validity window is relative to when THIS recipient's email went
// out (not a fixed calendar date) can't be a single dashboard-managed code
// shared by everyone.
async function ensureWinbackCoupon(stripe: ReturnType<typeof getStripe>): Promise<void> {
  try {
    await stripe.coupons.retrieve(COUPON_ID)
  } catch {
    await stripe.coupons.create({ id: COUPON_ID, percent_off: COUPON_PERCENT_OFF, duration: 'once', name: 'Trial win-back 30% off' })
  }
}

// Reuses the existing stripe_customer_id if the trial user already has one
// (unlikely — the 14-day trial never requires a card — but possible if
// they started a paid checkout before), otherwise creates a bare Stripe
// Customer (no payment method attached) purely so the promo code below can
// be locked to them.
export async function ensureStripeCustomer(admin: ReturnType<typeof createAdminClient>, profileId: string, email: string): Promise<string> {
  const stripe = getStripe()
  const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', profileId).single()
  let customerId = profile?.stripe_customer_id as string | undefined | null
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: profileId } })
    customerId = customer.id
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', profileId)
  }
  return customerId
}

// A fresh, single-use, customer-locked promotion code per recipient —
// max_redemptions: 1 and the customer restriction both mean this exact
// code is worthless to anyone but the person it was emailed to, even if it
// leaked, and expires_at enforces the "valid 14 days from send" window
// independently per recipient (impossible with one shared dashboard code).
export async function createWinbackPromoCode(stripeCustomerId: string): Promise<{ code: string; expiresAt: Date }> {
  const stripe = getStripe()
  await ensureWinbackCoupon(stripe)

  const suffix = randomBytes(4).toString('hex').toUpperCase()
  const code = `COMEBACK30-${suffix}`
  const expiresAt = new Date(Date.now() + PROMO_CODE_VALID_DAYS * 24 * 60 * 60 * 1000)

  await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: COUPON_ID },
    code,
    customer: stripeCustomerId,
    max_redemptions: 1,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
  })

  return { code, expiresAt }
}
