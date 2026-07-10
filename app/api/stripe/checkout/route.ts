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
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  let customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/cennik?checkout=cancelled`,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id, plan_id: plan.id, billing_cycle: cycle },
    subscription_data: { metadata: { supabase_user_id: user.id, plan_id: plan.id, billing_cycle: cycle } },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
