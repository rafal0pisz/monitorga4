import { createClient, createAdminClient } from '@/lib/supabase/server'
import { planLimit, planName, planById } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'
import { getCompanyDetails } from '@/lib/stripe/companyDetails'
import BillingActions from '@/components/billing/BillingActions'
import CompanyDetailsForm from '@/components/billing/CompanyDetailsForm'
import Link from 'next/link'

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
          date: new Date(inv.created * 1000).toLocaleDateString('en-GB'),
          amount: `${(inv.total / 100).toFixed(2)} ${inv.currency.toUpperCase()}`,
          status: inv.status ?? 'unknown',
          pdfUrl: inv.invoice_pdf ?? null,
        }))
      } catch {
        // No invoices yet, or a transient Stripe API issue — the section
        // just renders empty, doesn't block the rest of the page.
      }

      const company = await getCompanyDetails(stripeCustomerId)
      companyName = company.name
      companyLine1 = company.line1
      companyCity = company.city
      companyPostalCode = company.postalCode
      companyNip = company.nip
    }
  }

  const limit = planLimit(planId)
  const isUnlimited = limit >= Number.MAX_SAFE_INTEGER
  const hasPurchasablePlan = !!planById(planId ?? '')

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Billing</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Your plan and billing details</p>
      </div>

      {updated === '1' && (
        <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Plan updated. The change (and any prorated charge) will show up on your account within a few seconds.</p>
        </div>
      )}

      {/* Current plan */}
      <section>
        <h2 style={sectionH2}>Current plan</h2>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>{planName(planId)}</span>
            {subscriptionStatus && subscriptionStatus !== 'active' && (
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9a3412', background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 6, padding: '3px 9px' }}>{subscriptionStatus}</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
            {projectCount} / {isUnlimited ? '∞' : limit} monitored GA4 properties
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
            {currentPeriodEnd ? `Valid until: ${new Date(currentPeriodEnd).toLocaleDateString('en-GB')}` : hasPurchasablePlan ? '' : 'No expiry date'}
          </p>
          <BillingActions hasPurchasablePlan={hasPurchasablePlan} />
        </div>
        {!hasPurchasablePlan && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 12 }}>
            You don&apos;t have a paid plan yet — pick one below.
          </p>
        )}
      </section>

      {/* Change plan */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Change plan</h2>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 380 }}>
            {hasPurchasablePlan
              ? 'Compare plans and switch anytime — if you already have an active subscription, picking a new plan updates it in place instead of starting a second one.'
              : 'Compare plans and pick the one that fits how many GA4 properties you monitor.'}
          </p>
          <Link href="/cennik" style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}>
            View pricing →
          </Link>
        </div>
      </section>

      {/* Invoices */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Invoices</h2>
        {invoices.length > 0 ? (
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
            {invoices.map((inv, i) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 20px', borderBottom: i < invoices.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', width: 90, flexShrink: 0 }}>{inv.date}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.number ?? inv.id}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', flexShrink: 0 }}>{inv.amount}</span>
                <span style={{ fontSize: 11, color: inv.status === 'paid' ? '#16a34a' : 'var(--color-text-secondary)', flexShrink: 0, width: 60 }}>{inv.status}</span>
                {inv.pdfUrl ? (
                  <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: '#16a34a', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>Download ↓</a>
                ) : <span style={{ width: 60, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No invoices yet.</p>
        )}
      </section>

      {/* Company details */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Company details</h2>
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
