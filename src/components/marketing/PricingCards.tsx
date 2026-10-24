'use client'

import { useState } from 'react'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

interface PlanCard {
  id: string
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
}

export default function PricingCards({
  plans, loggedIn, currentPlanId,
}: {
  plans: PlanCard[]
  loggedIn: boolean
  currentPlanId?: string | null
}) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useTrackedError('pricing_cards')

  async function handleSelect(planId: string) {
    if (!loggedIn) {
      window.location.href = '/login'
      return
    }
    setError(null)
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się rozpocząć płatności.')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  return (
    <div>
      <div className="pricing-toggle">
        <button type="button" className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>Miesięcznie</button>
        <button type="button" className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>Rocznie <span className="pricing-toggle-badge">-30%</span></button>
      </div>

      {error && <div className="contact-error" style={{ maxWidth: 480, margin: '0 auto 24px' }}>{error}</div>}

      <div className="pricing-grid">
        {plans.map(plan => {
          // Yearly cycle still bills the full priceYearlyPLN up front — this
          // only changes what's shown as the headline number. Showing the
          // monthly-equivalent as the big price (with the real annual charge
          // called out underneath) matches what every card actually bills on
          // checkout, instead of making the annual total look like a much
          // bigger number at a glance.
          const displayPrice = cycle === 'monthly' ? plan.priceMonthlyPLN : Math.round(plan.priceYearlyPLN / 12)
          const isCurrent = plan.id === currentPlanId
          return (
            <div key={plan.id} className="pricing-card" style={isCurrent ? { borderColor: '#16a34a', boxShadow: '0 0 0 1px #16a34a' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>{plan.name}</h3>
                {isCurrent && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 8px' }}>obecny</span>}
              </div>
              <p className="pricing-limit">do {plan.projectLimit} {plan.projectLimit === 1 ? 'usługi' : 'usług'} GA4</p>
              <div className="pricing-price">
                <span className="amount">{displayPrice} zł</span>
                <span className="period">+ VAT / mies.</span>
              </div>
              {cycle === 'yearly' && <p className="pricing-annual-note">Opłata roczna: {plan.priceYearlyPLN} zł + VAT</p>}
              <button
                type="button"
                className="btn btn--primary"
                style={{ width: '100%', marginTop: 16 }}
                disabled={loadingPlan === plan.id || isCurrent}
                onClick={() => handleSelect(plan.id)}
              >
                {isCurrent ? 'Twój obecny plan' : loadingPlan === plan.id ? 'Przekierowanie…' : loggedIn ? (currentPlanId ? 'Przełącz na ten plan' : 'Wybierz plan') : 'Zarejestruj się'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
