import { createClient, createAdminClient } from '@/lib/supabase/server'
import { planLimit, planName, planById } from '@/lib/billing/plans'
import BillingActions from '@/components/billing/BillingActions'
import Link from 'next/link'

export default async function BillingPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let planId: string | null = null
  let subscriptionStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let projectCount = 0

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
    </div>
  )
}
