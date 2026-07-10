import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { planByStripePriceId } from '@/lib/billing/plans'

// Stripe wysyła ten sam event wielokrotnie przy retry — billing_events.stripe_event_id
// jest unikalny, więc drugi insert tego samego eventu rzuca błąd i przerywamy
// przetwarzanie zamiast zaktualizować profil dwa razy.
async function alreadyProcessed(supabase: ReturnType<typeof createAdminClient>, event: Stripe.Event): Promise<boolean> {
  const { error } = await supabase.from('billing_events').insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  })
  // Postgres unique_violation
  return !!error && (error as { code?: string }).code === '23505'
}

async function resolveProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string,
  metadataUserId: string | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId
  const { data } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
  return data?.id ?? null
}

function planFromSubscription(subscription: Stripe.Subscription): { planId: string | null; cycle: string | null } {
  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) return { planId: null, cycle: null }
  const plan = planByStripePriceId(priceId)
  if (!plan) return { planId: null, cycle: null }
  const cycle = plan.stripePriceId.yearly === priceId ? 'yearly' : 'monthly'
  return { planId: plan.id, cycle }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (await alreadyProcessed(supabase, event)) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) break
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const profileId = await resolveProfileId(supabase, subscription.customer as string, session.metadata?.supabase_user_id)
      if (!profileId) break
      const { planId, cycle } = planFromSubscription(subscription)
      await supabase.from('profiles').update({
        plan_id: planId,
        billing_cycle: cycle,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
      }).eq('id', profileId)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const profileId = await resolveProfileId(supabase, subscription.customer as string, subscription.metadata?.supabase_user_id)
      if (!profileId) break
      const { planId, cycle } = planFromSubscription(subscription)
      await supabase.from('profiles').update({
        plan_id: planId,
        billing_cycle: cycle,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
      }).eq('id', profileId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const profileId = await resolveProfileId(supabase, subscription.customer as string, subscription.metadata?.supabase_user_id)
      if (!profileId) break
      // Subskrypcja faktycznie się skończyła — cofamy plan do braku planu
      // (0 projektów limit). Istniejące projekty NIE są usuwane ani
      // wstrzymywane, tylko tworzenie nowych zostaje zablokowane.
      await supabase.from('profiles').update({
        plan_id: null,
        subscription_status: subscription.status,
      }).eq('id', profileId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (!customerId) break
      const profileId = await resolveProfileId(supabase, customerId, undefined)
      if (!profileId) break
      // Nie odbieramy dostępu od razu — Stripe sam ponawia próby płatności i
      // finalnie wyśle customer.subscription.updated/deleted jeśli się nie uda.
      await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', profileId)
      break
    }
  }

  return NextResponse.json({ ok: true })
}
