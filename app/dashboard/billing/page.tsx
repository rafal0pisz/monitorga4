import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { planLimit, planName, planById, effectivePlanId, TRIAL_DAYS } from '@/lib/billing/plans'
import { getStripe } from '@/lib/stripe/client'
import { getCompanyDetails } from '@/lib/stripe/companyDetails'
import BillingActions from '@/components/billing/BillingActions'
import CompanyDetailsForm from '@/components/billing/CompanyDetailsForm'
import StartTrialButton from '@/components/billing/StartTrialButton'
import DangerZone from '@/components/billing/DangerZone'
import { getTeamContext } from '@/lib/team/access'
import Link from 'next/link'

interface InvoiceRow {
  id: string
  number: string | null
  date: string
  amount: string
  status: string
  pdfUrl: string | null
}

interface QuotaProject {
  id: string
  name: string
  ga4_quota: Record<string, { consumed?: number; remaining?: number }> | null
  ga4_quota_checked_at: string | null
}

const sectionH2: React.CSSProperties = { fontSize: 15, fontWeight: 500, margin: '0 0 12px', color: 'var(--color-text-primary)' }
const sectionWrap: React.CSSProperties = { marginTop: 40 }

export default async function BillingPage() {
  const user = await getAuthUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  // Billing is always about YOUR OWN account — being on someone else's
  // team (see src/lib/team/access.ts) is a separate, independent context
  // that never hides or redirects this page.
  const teamContext = !bypass && user ? await getTeamContext(user.id) : null

  const supabase = createAdminClient()
  let planId: string | null = null
  let subscriptionStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let cancelAtPeriodEnd = false
  let projectCount = 0
  let invoices: InvoiceRow[] = []
  let stripeCustomerId: string | null = null
  let companyName = ''
  let companyLine1 = ''
  let companyCity = ''
  let companyPostalCode = ''
  let companyNip = ''
  let trialEndsAt: string | null = null
  let trialUsedAt: string | null = null
  let quotaProjects: QuotaProject[] = []
  let teamOwnerEmail: string | null = null

  if (!bypass && user) {
    // Independent queries — same owner, no data dependency — run as one
    // round trip instead of two sequential ones.
    const [{ data: profile }, { count }, { data: quotaRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('plan_id, subscription_status, current_period_end, cancel_at_period_end, stripe_customer_id, trial_ends_at, trial_used_at')
        .eq('id', user.id)
        .single(),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase.from('projects').select('id, name, ga4_quota, ga4_quota_checked_at').eq('owner_id', user.id).order('name'),
    ])
    planId = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
    subscriptionStatus = profile?.subscription_status ?? null
    currentPeriodEnd = profile?.current_period_end ?? null
    cancelAtPeriodEnd = profile?.cancel_at_period_end ?? false
    stripeCustomerId = profile?.stripe_customer_id ?? null
    trialEndsAt = profile?.trial_ends_at ?? null
    trialUsedAt = profile?.trial_used_at ?? null
    projectCount = count ?? 0
    quotaProjects = ((quotaRows ?? []) as QuotaProject[]).filter(p => p.ga4_quota)

    if (stripeCustomerId) {
      const stripe = getStripe()
      // Two independent Stripe API calls — also run in parallel rather
      // than one after another.
      const [invoicesResult, company] = await Promise.all([
        stripe.invoices.list({ customer: stripeCustomerId, limit: 12 }).catch(() => null),
        getCompanyDetails(stripeCustomerId),
      ])
      if (invoicesResult) {
        invoices = invoicesResult.data.map(inv => ({
          id: inv.id ?? '',
          number: inv.number,
          date: new Date(inv.created * 1000).toLocaleDateString('en-GB'),
          amount: `${(inv.total / 100).toFixed(2)} ${inv.currency.toUpperCase()}`,
          status: inv.status ?? 'unknown',
          pdfUrl: inv.invoice_pdf ?? null,
        }))
      }
      companyName = company.name
      companyLine1 = company.line1
      companyCity = company.city
      companyPostalCode = company.postalCode
      companyNip = company.nip
    }

    if (teamContext?.isMember && teamContext.teamOwnerId) {
      const { data: ownerUser } = await supabase.auth.admin.getUserById(teamContext.teamOwnerId)
      teamOwnerEmail = ownerUser?.user?.email ?? null
    }
  }

  const limit = planLimit(planId)
  const isUnlimited = limit >= Number.MAX_SAFE_INTEGER
  const hasPurchasablePlan = !!planById(planId ?? '')
  const isTrial = planId === 'trial'
  const trialDaysLeft = isTrial && trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)) : 0
  const canStartTrial = !planId && !trialUsedAt

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Billing</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Your plan and billing details</p>
        {teamOwnerEmail && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            You&apos;re also on <b>{teamOwnerEmail}</b>&apos;s team — that&apos;s separate from your own plan below. See <Link href="/dashboard/team" style={{ color: '#16a34a' }}>Team</Link>.
          </p>
        )}
      </div>

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
            {user?.email}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
            {projectCount} / {isUnlimited ? '∞' : limit} monitored GA4 properties
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
            {isTrial
              ? `Trial ends in ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'}`
              : currentPeriodEnd ? `Valid until: ${new Date(currentPeriodEnd).toLocaleDateString('en-GB')}` : hasPurchasablePlan ? '' : 'No expiry date'}
          </p>
          {cancelAtPeriodEnd && (
            <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 12.5, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
                <b>Subscription canceled.</b> Your {planName(planId)} plan stays active
                {currentPeriodEnd ? ` until ${new Date(currentPeriodEnd).toLocaleDateString('en-GB')}` : ' until the end of the current billing period'},
                then your account reverts to no plan. Changed your mind? Resume it from Manage billing below.
              </p>
            </div>
          )}
          <BillingActions hasPurchasablePlan={hasPurchasablePlan} />
          {isTrial && (
            <div style={{ marginTop: 12 }}>
              <Link href="/cennik" style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
                Upgrade to a paid plan →
              </Link>
            </div>
          )}
        </div>
        {!planId && (
          <div style={{ marginTop: 12 }}>
            {canStartTrial ? (
              <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, color: '#166534', margin: '0 0 10px' }}>
                  Try AlertGA4 free for {TRIAL_DAYS} days on Pro terms (up to 15 GA4 properties) — no card required. One-time only.
                </p>
                <StartTrialButton label={`Start ${TRIAL_DAYS}-day free trial`} lang="en" />
              </div>
            ) : (
              // Reached only when !canStartTrial, which under the !planId
              // branch above always means trialUsedAt is set — i.e. this is
              // a lapsed trial, not someone who never had a plan at all.
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Your free trial has ended. Upgrade to a paid plan to keep using AlertGA4 — pick one below.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Using — GA4 Data API quota per property, refreshed on every daily check run */}
      {quotaProjects.length > 0 && (
        <section style={sectionWrap}>
          <h2 style={sectionH2}>Using</h2>
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
            {quotaProjects.map((p, i) => {
              const daily = p.ga4_quota?.tokensPerDay
              const consumed = daily?.consumed ?? 0
              const remaining = daily?.remaining ?? 0
              const total = consumed + remaining
              const pct = total > 0 ? Math.round((consumed / total) * 100) : 0
              const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#ca8a04' : '#16a34a'
              return (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: i < quotaProjects.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{consumed.toLocaleString('en')} / {total.toLocaleString('en')} daily tokens</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-background-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                  {p.ga4_quota_checked_at && (
                    <p style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', margin: '5px 0 0' }}>
                      Last checked: {new Date(p.ga4_quota_checked_at).toLocaleString('en-GB')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Google's GA4 Data API daily token quota per property, refreshed each time the daily check runs.
          </p>
        </section>
      )}

      {/* Change plan */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Change plan</h2>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 380 }}>
            {hasPurchasablePlan
              ? 'Compare plans and switch anytime — picking a new plan goes through checkout again, and your previous subscription is cancelled automatically once the new one is confirmed.'
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

      {/* Your data */}
      <section style={sectionWrap}>
        <h2 style={sectionH2}>Your data</h2>
        <DangerZone />
      </section>
    </div>
  )
}
