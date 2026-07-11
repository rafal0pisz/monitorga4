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
      .select('stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', user.id).single()

    // Already on an active/trialing/past_due subscription — change it in
    // place instead of starting a second Checkout Session, which would
    // create a second, parallel subscription and double-bill the customer.
    // Stripe prorates the difference automatically.
    const liveStatuses = ['active', 'trialing', 'past_due']
    if (profile?.stripe_subscription_id && liveStatuses.includes(profile.subscription_status ?? '')) {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: subscription.items.data[0].id, price: priceId }],
        proration_behavior: 'create_prorations',
        metadata: { supabase_user_id: user.id, plan_id: plan.id, billing_cycle: cycle },
      })
      return NextResponse.json({ updated: true })
    }

    let customerId = profile?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
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
    // Surfaced to the caller (Stripe SDK errors are safe to show — messages
    // like "No such price" contain no secrets) instead of a bare 500 that
    // hides the actual cause behind a generic "coś poszło nie tak".
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
