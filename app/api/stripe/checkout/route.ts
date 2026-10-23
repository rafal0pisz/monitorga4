import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { planById, type BillingCycle } from '@/lib/billing/plans'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const planId = typeof body?.planId === 'string' ? body.planId : ''
  const cycle: BillingCycle = body?.cycle === 'yearly' ? 'yearly' : 'monthly'

  const plan = planById(planId)
  if (!plan) return NextResponse.json({ error: 'Nieznany plan' }, { status: 400 })

  const priceId = plan.stripePriceId[cycle]
  if (!priceId) return NextResponse.json({ error: 'Ten plan nie jest jeszcze dostępny do zakupu' }, { status: 500 })

  const supabase = createAdminClient()

  try {
    const { data: profile } = await supabase.from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id).single()

    let customerId = profile?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    } else {
      // Stripe Checkout only shows the "buying as a business" / tax ID field
      // once per customer — once a tax ID is saved, it's permanently hidden
      // on every future Checkout Session, even with tax_id_collection
      // enabled. Clearing it here brings the field back for every purchase,
      // so a returning customer can re-confirm or change company details.
      // (The name/address stay on the customer; only the VAT ID itself is
      // reset, and only right before a fresh Checkout Session is started.)
      const existingTaxIds = await stripe.customers.listTaxIds(customerId, { limit: 10 })
      for (const taxId of existingTaxIds.data) {
        if (taxId.type === 'eu_vat') await stripe.customers.deleteTaxId(customerId, taxId.id)
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      // Pozwala kupującemu wpisać nazwę firmy, adres i NIP/VAT ID podczas
      // płatności — bez tego Stripe generuje fakturę tylko na e-mail, bez
      // możliwości wystawienia jej na firmę.
      customer_update: { name: 'auto', address: 'auto' },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      // Stripe Tax: calculates VAT per the customer's billing address and
      // the account's Tax settings (registrations: Poland domestic + EU
      // OSS; "Include tax in prices" = No, so prices in plans.ts are net
      // and VAT is added on top). Requires Stripe Tax to be configured
      // (origin address + registrations) — without that, Checkout Session
      // creation itself fails, so this must only ship once that's done.
      automatic_tax: { enabled: true },
      // Shows a "Add promotion code" field on the Stripe-hosted checkout
      // page — the actual coupons/promotion codes are created and managed
      // directly in the Stripe Dashboard, not in this app.
      allow_promotion_codes: true,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, plan_id: plan.id, billing_cycle: cycle },
      subscription_data: { metadata: { supabase_user_id: user.id, plan_id: plan.id, billing_cycle: cycle } },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    // Never surface the raw Stripe/API error to the customer — everything
    // caught here happens BEFORE any redirect to Stripe's own checkout
    // page, so it's always a server-side problem (misconfigured API key,
    // missing/mismatched Price id, Stripe Tax not set up, etc.), never
    // something the customer did wrong or needs the detail of. A past
    // version of this deliberately showed the raw message "since Stripe
    // SDK errors are safe" — but "safe" isn't the bar for a paying
    // customer mid-checkout; logged in full here instead (Vercel function
    // logs) for actual debugging.
    console.error('[stripe/checkout] Failed to create checkout session:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę lub napisz do nas: kontakt@bettersteps.pl' }, { status: 500 })
  }
}
