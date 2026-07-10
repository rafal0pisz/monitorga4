import Link from 'next/link'
import { getStripe } from '@/lib/stripe/client'
import { planById } from '@/lib/billing/plans'

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  let planLabel: string | null = null
  let paid = false
  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id)
      paid = session.payment_status === 'paid' || session.status === 'complete'
      planLabel = planById(session.metadata?.plan_id ?? '')?.name ?? null
    } catch {
      // Session ID nieprawidłowy lub wygasł — pokazujemy ogólne podziękowanie
      // zamiast błędu, płatność i tak jest potwierdzana asynchronicznie przez webhook.
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto 0', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22, fontWeight: 700 }}>✓</div>
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
        Dziękujemy za zakup{planLabel ? ` planu ${planLabel}` : ''}!
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 28px' }}>
        {paid
          ? 'Płatność przyjęta. Twój plan i limit projektów zaktualizują się w ciągu kilku sekund.'
          : 'Dziękujemy — potwierdzenie płatności dotrze do Twojego konta automatycznie w ciągu kilku sekund.'}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/dashboard" style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13.5 }}>
          Przejdź do panelu
        </Link>
        <Link href="/dashboard/billing" style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', fontWeight: 500, padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13.5 }}>
          Szczegóły planu
        </Link>
      </div>
    </div>
  )
}
