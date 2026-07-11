import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 200) : ''
  const line1 = typeof body?.line1 === 'string' ? body.line1.trim().slice(0, 200) : ''
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 100) : ''
  const postalCode = typeof body?.postalCode === 'string' ? body.postalCode.trim().slice(0, 20) : ''
  const nip = typeof body?.nip === 'string' ? body.nip.replace(/[^0-9A-Za-z]/g, '').slice(0, 20) : ''

  const supabase = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
  const customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account yet — company details can be set after your first plan purchase.' }, { status: 400 })
  }

  try {
    // Updates the Stripe Customer object, which Stripe uses to generate
    // EVERY future invoice (renewal, plan change) — so this genuinely stays
    // in sync with the purchase, as requested. Already-issued (finalized)
    // invoices can't be changed retroactively — that's an accounting
    // constraint, not a gap in this integration.
    await stripe.customers.update(customerId, {
      name: name || undefined,
      address: line1 ? { line1, city, postal_code: postalCode, country: 'PL' } : undefined,
    })

    const existing = await stripe.customers.listTaxIds(customerId, { limit: 10 })
    for (const taxId of existing.data) {
      if (taxId.type === 'eu_vat') await stripe.customers.deleteTaxId(customerId, taxId.id)
    }
    if (nip) {
      const value = nip.toUpperCase().startsWith('PL') ? nip.toUpperCase() : `PL${nip}`
      await stripe.customers.createTaxId(customerId, { type: 'eu_vat', value })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
