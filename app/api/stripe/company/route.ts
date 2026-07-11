import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 })

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
    return NextResponse.json({ error: 'Brak konta rozliczeniowego — dane firmy można ustawić po pierwszym zakupie planu.' }, { status: 400 })
  }

  try {
    // Aktualizuje dane na koncie Klienta w Stripe, z którego Stripe generuje
    // KAŻDĄ przyszłą fakturę (odnowienie subskrypcji, zmianę planu) — więc
    // to naprawdę "łączy się" z zakupem, tak jak proszono. Już wystawionych
    // (zamkniętych) faktur nie da się retroaktywnie zmienić — to standard
    // księgowy, nie ograniczenie naszej integracji.
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
