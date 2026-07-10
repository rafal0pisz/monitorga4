import { createClient, createAdminClient } from '@/lib/supabase/server'
import { planLimit, planName, planById } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'
import BillingActions from '@/components/billing/BillingActions'
import Link from 'next/link'

interface InvoiceRow {
  id: string
  number: string | null
  date: string
  amount: string
  status: string
  pdfUrl: string | null
}

export default async function BillingPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let planId: string | null = null
  let subscriptionStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let projectCount = 0
  let invoices: InvoiceRow[] = []

  if (!bypass && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id, subscription_status, current_period_end, stripe_customer_id')
      .eq('id', user.id)
      .single()
    planId = profile?.plan_id ?? null
    subscriptionStatus = profile?.subscription_status ?? null
    currentPeriodEnd = profile?.current_period_end ?? null

    const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
    projectCount = count ?? 0

    if (profile?.stripe_customer_id) {
      try {
        const list = await getStripe().invoices.list({ customer: profile.stripe_customer_id, limit: 12 })
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
    }
  }

  const limit = planLimit(planId)
  const isUnlimited = limit >= Number.MAX_SAFE_INTEGER
  const hasPurchasablePlan = !!planById(planId ?? '')

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Billing</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Twój plan i rozliczenia</p>
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>{planName(planId)}</span>
          {subscriptionStatus && subscriptionStatus !== 'active' && (
            <span style={{ fontSize: 11, fontWeight: 500, color: '#9a3412', background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 6, padding: '3px 9px' }}>{subscriptionStatus}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
          {projectCount} / {isUnlimited ? '∞' : limit} monitorowanych usług GA4
        </p>
        {currentPeriodEnd && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
            Odnowienie: {new Date(currentPeriodEnd).toLocaleDateString('pl-PL')}
          </p>
        )}
      </div>

      <BillingActions hasPurchasablePlan={hasPurchasablePlan} />

      {!hasPurchasablePlan && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 16 }}>
          Nie masz jeszcze wykupionego planu. <Link href="/cennik" style={{ color: '#16a34a', fontWeight: 500 }}>Zobacz cennik</Link>
        </p>
      )}

      {invoices.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px', color: 'var(--color-text-primary)' }}>Faktury</h2>
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
        </div>
      )}
    </div>
  )
}
