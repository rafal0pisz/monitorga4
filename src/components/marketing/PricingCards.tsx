'use client'

import { useState } from 'react'

interface PlanCard {
  id: string
  name: string
  projectLimit: number
  priceMonthlyPLN: number
  priceYearlyPLN: number
}

interface CompanyDraft {
  name: string
  line1: string
  city: string
  postalCode: string
  nip: string
}

const modalFieldStyle: React.CSSProperties = {
  fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e6e8',
  background: '#fff', color: '#232b31', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const modalLabelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#5b6570', marginBottom: 4, display: 'block' }

export default function PricingCards({
  plans, loggedIn, currentPlanId,
}: {
  plans: PlanCard[]
  loggedIn: boolean
  currentPlanId?: string | null
}) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Switching an existing subscription updates it in place — no Stripe
  // Checkout page is shown for that path, so there's nowhere for the
  // customer to see/confirm their billing details are set correctly.
  // This modal fills that gap, pre-filled from whatever's already on file.
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [company, setCompany] = useState<CompanyDraft | null>(null)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  async function proceedToCheckout(planId: string) {
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się rozpocząć płatności.')
      if (data.updated) {
        window.location.href = '/dashboard/billing?updated=1'
      } else {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoadingPlan(null)
      throw err
    }
  }

  async function handleSelect(planId: string) {
    if (!loggedIn) {
      window.location.href = '/login'
      return
    }
    setError(null)

    if (currentPlanId) {
      setPendingPlan(planId)
      setConfirmError(null)
      setCompanyLoading(true)
      try {
        const res = await fetch('/api/stripe/company')
        const data = await res.json().catch(() => ({}))
        setCompany({
          name: data.name ?? '', line1: data.line1 ?? '', city: data.city ?? '',
          postalCode: data.postalCode ?? '', nip: data.nip ?? '',
        })
      } catch {
        setCompany({ name: '', line1: '', city: '', postalCode: '', nip: '' })
      } finally {
        setCompanyLoading(false)
      }
      return
    }

    proceedToCheckout(planId)
  }

  async function handleConfirmSwitch() {
    if (!pendingPlan || !company) return
    setConfirmError(null)
    setConfirming(true)
    try {
      const res = await fetch('/api/stripe/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się zapisać danych firmy.')
      await proceedToCheckout(pendingPlan)
    } catch (err: any) {
      setConfirmError(err.message)
      setConfirming(false)
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
          const isCurrent = plan.id === currentPlanId
          return (
            <div key={plan.id} className="pricing-card" style={isCurrent ? { borderColor: '#16a34a', boxShadow: '0 0 0 1px #16a34a' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>{plan.name}</h3>
                {isCurrent && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 8px' }}>obecny</span>}
              </div>
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
                disabled={loadingPlan === plan.id || isCurrent || companyLoading}
                onClick={() => handleSelect(plan.id)}
              >
                {isCurrent ? 'Twój obecny plan' : loadingPlan === plan.id || (companyLoading && pendingPlan === plan.id) ? 'Przetwarzanie…' : loggedIn ? (currentPlanId ? 'Przełącz na ten plan' : 'Wybierz plan') : 'Zarejestruj się'}
              </button>
            </div>
          )
        })}
      </div>

      {pendingPlan && company && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(35,43,49,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#232b31' }}>Potwierdź dane do faktury</h3>
            <p style={{ fontSize: 12.5, color: '#5b6570', margin: '0 0 16px', lineHeight: 1.5 }}>
              Ta zmiana planu zostanie rozliczona na te dane. Uzupełnione automatycznie z Twojego konta — możesz je poprawić poniżej. Zostaw puste, jeśli kupujesz jako osoba prywatna.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={modalLabelStyle} htmlFor="pc-name">Nazwa firmy</label>
                <input id="pc-name" style={modalFieldStyle} value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} placeholder="Twoja Firma Sp. z o.o." />
              </div>
              <div>
                <label style={modalLabelStyle} htmlFor="pc-line1">Adres</label>
                <input id="pc-line1" style={modalFieldStyle} value={company.line1} onChange={e => setCompany({ ...company, line1: e.target.value })} placeholder="ul. Przykładowa 1" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={modalLabelStyle} htmlFor="pc-postal">Kod pocztowy</label>
                  <input id="pc-postal" style={modalFieldStyle} value={company.postalCode} onChange={e => setCompany({ ...company, postalCode: e.target.value })} placeholder="00-000" />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={modalLabelStyle} htmlFor="pc-city">Miasto</label>
                  <input id="pc-city" style={modalFieldStyle} value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })} placeholder="Warszawa" />
                </div>
              </div>
              <div>
                <label style={modalLabelStyle} htmlFor="pc-nip">NIP</label>
                <input id="pc-nip" style={modalFieldStyle} value={company.nip} onChange={e => setCompany({ ...company, nip: e.target.value })} placeholder="1234567890" />
              </div>
            </div>

            {confirmError && <div className="contact-error" style={{ marginBottom: 12, fontSize: 12.5 }}>{confirmError}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setPendingPlan(null); setCompany(null) }}
                disabled={confirming}
                style={{ background: '#f3f6f7', border: '1px solid #e2e6e8', color: '#232b31', fontWeight: 500, padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                disabled={confirming}
                className="btn btn--primary"
              >
                {confirming ? 'Przetwarzanie…' : 'Potwierdź i przełącz plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
