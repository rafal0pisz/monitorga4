import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { planByStripePriceId } from '@/lib/billing/plans'

async function alreadyProcessed(supabase: ReturnType<typeof createAdminClient>, eventId: string): Promise<boolean> {
  const { data } = await supabase.from('billing_events').select('id').eq('stripe_event_id', eventId).maybeSingle()
  return !!data
}

// Marks the event done only once processing actually succeeds — if this ran
// before processing and processing then threw, a Stripe retry of the same
// event would see it as "already processed" and skip it forever, silently
// leaving the profile never updated. A harmless side effect of marking it
// after the fact: if processing succeeds but this insert's response is lost
// and Stripe retries anyway, we just re-apply the same (idempotent) update.
async function markProcessed(supabase: ReturnType<typeof createAdminClient>, event: Stripe.Event) {
  await supabase.from('billing_events').insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  })
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

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const ts = subscription.items.data[0]?.current_period_end
  return ts ? new Date(ts * 1000).toISOString() : null
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    // .trim() — a stray trailing newline/space pasted into the Vercel env var
    // makes every signature check fail with no useful error beyond "no
    // signatures found", so we defend against that specific paste mistake here.
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!.trim())
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (await alreadyProcessed(supabase, event.id)) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const profileId = await resolveProfileId(supabase, subscription.customer as string, session.metadata?.supabase_user_id)
        if (!profileId) break

        const { data: existingProfile } = await supabase.from('profiles').select('stripe_subscription_id').eq('id', profileId).single()
        const previousSubscriptionId = existingProfile?.stripe_subscription_id as string | null | undefined

        const { planId, cycle } = planFromSubscription(subscription)
        await supabase.from('profiles').update({
          plan_id: planId,
          billing_cycle: cycle,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: periodEndIso(subscription),
        }).eq('id', profileId)

        // Buying through Checkout again while a different subscription is
        // still live (switching plans) would otherwise leave two active
        // subscriptions billing the same customer — cancel the old one now
        // that the new one is confirmed. No proration credit is issued for
        // the unused portion of the old subscription.
        if (previousSubscriptionId && previousSubscriptionId !== subscription.id) {
          try {
            await stripe.subscriptions.cancel(previousSubscriptionId)
          } catch {
            // Already canceled or gone — nothing to do.
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const profileId = await resolveProfileId(supabase, subscription.customer as string, subscription.metadata?.supabase_user_id)
        if (!profileId) break

        // A subscription switch cancels the old subscription, which can
        // also emit an update event for it on the way to being deleted —
        // ignore anything that isn't the profile's current subscription so
        // stale events can't clobber a plan already switched to.
        const { data: currentProfile } = await supabase.from('profiles').select('stripe_subscription_id').eq('id', profileId).single()
        if (currentProfile?.stripe_subscription_id && currentProfile.stripe_subscription_id !== subscription.id) break

        const { planId, cycle } = planFromSubscription(subscription)
        await supabase.from('profiles').update({
          plan_id: planId,
          billing_cycle: cycle,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: periodEndIso(subscription),
        }).eq('id', profileId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const profileId = await resolveProfileId(supabase, subscription.customer as string, subscription.metadata?.supabase_user_id)
        if (!profileId) break

        // Same guard as above: don't let the cancellation of a superseded
        // (switched-away-from) subscription wipe out a plan the profile has
        // already moved on to.
        const { data: currentProfile } = await supabase.from('profiles').select('stripe_subscription_id').eq('id', profileId).single()
        if (currentProfile?.stripe_subscription_id !== subscription.id) break

        // Subscription actually ended — revert to no plan (0 project limit).
        // Existing projects are NOT deleted or paused, only new creation
        // gets blocked.
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
  } catch (err) {
    // Do NOT mark as processed — Stripe retries on non-2xx, which is what we
    // want: a transient failure here should be retried, not silently dropped.
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }

  await markProcessed(supabase, event)
  return NextResponse.json({ ok: true })
}
