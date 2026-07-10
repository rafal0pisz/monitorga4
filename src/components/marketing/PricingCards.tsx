'use client'

import { useState } from 'react'

interface PlanCard {
  id: string
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
}

export default function PricingCards({ plans, loggedIn }: { plans: PlanCard[]; loggedIn: boolean }) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        <button type="button" className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>Rocznie <span className="pricing-toggle-badge">taniej</span></button>
      </div>

      {error && <div className="contact-error" style={{ maxWidth: 480, margin: '0 auto 24px' }}>{error}</div>}

      <div className="pricing-grid">
        {plans.map(plan => {
          const price = cycle === 'monthly' ? plan.priceMonthlyPLN : plan.priceYearlyPLN
          const perMonth = cycle === 'yearly' ? Math.round(plan.priceYearlyPLN / 12) : plan.priceMonthlyPLN
          return (
            <div key={plan.id} className="pricing-card">
              <h3>{plan.name}</h3>
              <p className="pricing-limit">do {plan.projectLimit} {plan.projectLimit === 1 ? 'usługi' : 'usług'} GA4</p>
              <div className="pricing-price">
                <span className="amount">{price} zł</span>
                <span className="period">/ {cycle === 'monthly' ? 'mies.' : 'rok'}</span>
              </div>
              {cycle === 'yearly' && <p className="pricing-permonth">≈ {perMonth} zł/mies.</p>}
              <button
                type="button"
                className="btn btn--primary"
                style={{ width: '100%', marginTop: 16 }}
                disabled={loadingPlan === plan.id}
                onClick={() => handleSelect(plan.id)}
              >
                {loadingPlan === plan.id ? 'Przekierowanie…' : loggedIn ? 'Wybierz plan' : 'Zarejestruj się'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
