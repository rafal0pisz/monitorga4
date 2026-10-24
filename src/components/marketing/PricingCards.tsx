'use client'

import { useState } from 'react'
import { useTrackedError } from '@/lib/analytics/useTrackedError'
import type { Locale } from '@/lib/i18n/routes'

interface PlanCard {
  id: string
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
}

const STRINGS = {
  pl: {
    monthly: 'Miesięcznie', yearly: 'Rocznie', yearlyBadge: '-30%',
    unit: ' + VAT / mies.',
    annualNote: (total: number) => `Opłata roczna: ${total} zł + VAT`,
    perService: (n: number) => `do ${n} ${n === 1 ? 'usługi' : 'usług'} GA4`,
    current: 'obecny', currentPlanBtn: 'Twój obecny plan', switchPlanBtn: 'Przełącz na ten plan',
    choosePlanBtn: 'Wybierz plan', signUpBtn: 'Zarejestruj się', redirecting: 'Przekierowanie…',
    genericError: 'Nie udało się rozpocząć płatności.',
    amount: (n: number) => `${n} zł`,
  },
  en: {
    monthly: 'Monthly', yearly: 'Yearly', yearlyBadge: '-30%',
    unit: ' + VAT / mo',
    annualNote: (total: number) => `Billed yearly: ${total} PLN + VAT`,
    perService: (n: number) => `up to ${n} GA4 ${n === 1 ? 'property' : 'properties'}`,
    current: 'current', currentPlanBtn: 'Your current plan', switchPlanBtn: 'Switch to this plan',
    choosePlanBtn: 'Choose plan', signUpBtn: 'Sign up', redirecting: 'Redirecting…',
    genericError: 'Could not start checkout.',
    amount: (n: number) => `${n} PLN`,
  },
}

export default function PricingCards({
  plans, loggedIn, currentPlanId, lang = 'pl',
}: {
  plans: PlanCard[]
  loggedIn: boolean
  currentPlanId?: string | null
  lang?: Locale
}) {
  const t = STRINGS[lang]
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
      if (!res.ok) throw new Error(data.error ?? t.genericError)
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  return (
    <div>
      <div className="pricing-toggle">
        <button type="button" className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>{t.monthly}</button>
        <button type="button" className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>{t.yearly} <span className="pricing-toggle-badge">{t.yearlyBadge}</span></button>
      </div>

      {error && <div className="contact-error" style={{ maxWidth: 480, margin: '0 auto 24px' }}>{error}</div>}

      <div className="pricing-grid">
        {plans.map(plan => {
          // Yearly cycle still bills the full priceYearlyPLN up front — this
          // only changes what's shown as the headline number. Showing the
          // monthly-equivalent as the big price (with the real annual charge
          // called out underneath) matches what's actually billed per month.
          const displayPrice = cycle === 'monthly' ? plan.priceMonthlyPLN : Math.round(plan.priceYearlyPLN / 12)
          const isCurrent = plan.id === currentPlanId
          return (
            <div key={plan.id} className="pricing-card" style={isCurrent ? { borderColor: '#16a34a', boxShadow: '0 0 0 1px #16a34a' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>{plan.name}</h3>
                {isCurrent && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 8px' }}>{t.current}</span>}
              </div>
              <p className="pricing-limit">{t.perService(plan.projectLimit)}</p>
              <div className="pricing-price">
                <span className="amount">{t.amount(displayPrice)}</span>
                <span className="period">{t.unit}</span>
              </div>
              {cycle === 'yearly' && <p className="pricing-annual-note">{t.annualNote(plan.priceYearlyPLN)}</p>}
              <button
                type="button"
                className="btn btn--primary"
                style={{ width: '100%', marginTop: 16 }}
                disabled={loadingPlan === plan.id || isCurrent}
                onClick={() => handleSelect(plan.id)}
              >
                {isCurrent ? t.currentPlanBtn : loadingPlan === plan.id ? t.redirecting : loggedIn ? (currentPlanId ? t.switchPlanBtn : t.choosePlanBtn) : t.signUpBtn}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
