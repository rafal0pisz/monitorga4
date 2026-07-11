import { createClient, createAdminClient } from '@/lib/supabase/server'
import { planLimit, planName, planById, PLANS } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'
import BillingActions from '@/components/billing/BillingActions'
import CompanyDetailsForm from '@/components/billing/CompanyDetailsForm'
import PricingCards from '@/components/marketing/PricingCards'

interface InvoiceRow {
  id: string
  number: string | null
  date: string
  amount: string
  status: string
  pdfUrl: string | null
}

const sectionH2: React.CSSProperties = { fontSize: 15, fontWeight: 500, margin: '0 0 12px', color: 'var(--color-text-primary)' }
const sectionWrap: React.CSSProperties = { marginTop: 40 }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>
}) {
  const { updated } = await searchParams
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let planId: string | null = null
  let subscriptionStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let projectCount = 0
  let invoices: InvoiceRow[] = []
  let stripeCustomerId: string | null = null
  let companyName = ''
  let companyLine1 = ''
  let companyCity = ''
  let companyPostalCode = ''
  let companyNip = ''

  if (!bypass && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id, subscription_status, current_period_end, stripe_customer_id')
      .eq('id', user.id)
      .single()
    planId = profile?.plan_id ?? null
    subscriptionStatus = profile?.subscription_status ?? null
    currentPeriodEnd = profile?.current_period_end ?? null
    stripeCustomerId = profile?.stripe_customer_id ?? null

    const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
    projectCount = count ?? 0

    if (stripeCustomerId) {
      const stripe = getStripe()
      try {
        const list = await stripe.invoices.list({ customer: stripeCustomerId, limit: 12 })
        invoices = list.data.map(inv => ({
          id: inv.id ?? '',
          number: inv.number,
          date: new Date(inv.created * 1000).toLocaleDateString('pl-PL'),
          amount: `${(inv.total / 100).toFixed(2)} ${inv.currency.toUpperCase()}`,
          status: inv.status ?? 'unknown',
          pdfUrl: inv.invoice_pdf ?? null,
        }))
      } catch {
        // Brak faktur lub chwilowy problem z API Stripe — sekcja po prostu
        // pokaże się jako pusta, nie blokujemy renderowania reszty strony.
      }

      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId)
        if (!customer.deleted) {
          companyName = customer.name ?? ''
          companyLine1 = customer.address?.line1 ?? ''
          companyCity = customer.address?.city ?? ''
          companyPostalCode = customer.address?.postal_code ?? ''
        }
        const taxIds = await stripe.customers.listTaxIds(stripeCustomerId, { limit: 5 })
        const vat = taxIds.data.find(t => t.type === 'eu_vat')
        companyNip = vat?.value.replace(/^PL/i, '') ?? ''
      } catch {
        // Konto rozliczeniowe istnieje, ale danych firmowych jeszcze nie ustawiono.
      }
    }
  }

  const limit = planLimit(planId)
  const isUnlimited = limit >= Number.MAX_SAFE_INTEGER
  const hasPurchasablePlan = !!planById(planId ?? '')

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Billing</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Twój plan i rozliczenia</p>
      </div>

      {updated === '1' && (
        <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Plan zaktualizowany. Zmiana (i ewentualna proporcjonalna dopłata) pojawi się na koncie w ciągu kilku sekund.</p>
        </div>
      )}

      {/* Obecny plan */}
      <section>
        <h2 style={sectionH2}>Obecny plan</h2>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>{planName(planId)}</span>
            {subscriptionStatus && subscriptionStatus !== 'active' && (
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9a3412', background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 6, padding: '3px 9px' }}>{subscriptionStatus}</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
            {projectCount} / {isUnlimited ? '∞' : limit} monitorowanych usług GA4
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
            {currentPeriodEnd ? `Plan ważny do: ${new Date(currentPeriodEnd).toLocaleDateString('pl-PL')}` : hasPurchasablePlan ? '' : 'Bez terminu ważności'}
          </p>
          <BillingActions hasPurchasablePlan={hasPurchasablePlan} />
        </div>
        {!hasPurchasablePlan && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Nie masz jeszcze wykupionego planu — wybierz go poniżej.
          </p>
        )}
      </section>

      {/* Zmiana planu */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Zmiana planu</h2>
        <PricingCards
          loggedIn={!!user}
          currentPlanId={hasPurchasablePlan ? planId : null}
          plans={PLANS.map(p => ({ id: p.id, name: p.name, projectLimit: p.projectLimit, priceMonthlyPLN: p.priceMonthlyPLN, priceYearlyPLN: p.priceYearlyPLN }))}
        />
      </section>

      {/* Faktury */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Faktury</h2>
        {invoices.length > 0 ? (
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
            {invoices.map((inv, i) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 20px', borderBottom: i < invoices.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', width: 90, flexShrink: 0 }}>{inv.date}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.number ?? inv.id}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', flexShrink: 0 }}>{inv.amount}</span>
                <span style={{ fontSize: 11, color: inv.status === 'paid' ? '#16a34a' : 'var(--color-text-secondary)', flexShrink: 0, width: 60 }}>{inv.status}</span>
                {inv.pdfUrl ? (
                  <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: '#16a34a', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>Pobierz ↓</a>
                ) : <span style={{ width: 60, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Brak wystawionych faktur.</p>
        )}
      </section>

      {/* Dane firmy */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Dane firmy</h2>
        <CompanyDetailsForm
          hasCustomer={!!stripeCustomerId}
          initialName={companyName}
          initialLine1={companyLine1}
          initialCity={companyCity}
          initialPostalCode={companyPostalCode}
          initialNip={companyNip}
        />
      </section>
    </div>
  )
}
