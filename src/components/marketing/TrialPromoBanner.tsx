import Link from 'next/link'
import { TRIAL_DAYS } from '@/lib/billing/plans'

// Same offer as .trial-banner-guest (see app/page.tsx, app/cennik/page.tsx)
// but set as a plain typographic statement — no card, no background —
// rather than a boxed ad block. See landingStyles.ts's .trial-promo-banner.
// Render it only for guests: `{!user && <TrialPromoBanner />}`.
export default function TrialPromoBanner() {
  return (
    <div className="trial-promo-banner">
      <h3>{TRIAL_DAYS} dni za darmo. <em>Bez karty.</em> Bez zobowiązań.</h3>
      <p>Pełny dostęp do AlertGA4 na zasadach planu Pro — do 15 monitorowanych usług GA4.</p>
      <Link href="/login" className="trial-promo-link">Rozpocznij bezpłatny okres próbny →</Link>
    </div>
  )
}
