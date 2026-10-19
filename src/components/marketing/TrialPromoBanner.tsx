import Link from 'next/link'
import { TRIAL_DAYS } from '@/lib/billing/plans'

// Same offer as .trial-banner-guest (see app/page.tsx, app/cennik/page.tsx)
// but styled to read as a standalone graphic/ad block rather than an
// inline note — see landingStyles.ts's .trial-promo-banner. Render it only
// for guests, same as the source layout: `{!user && <TrialPromoBanner />}`.
export default function TrialPromoBanner() {
  return (
    <div className="trial-promo-banner">
      <div className="trial-promo-number">{TRIAL_DAYS}<span>dni</span></div>
      <div className="trial-promo-body">
        <div className="trial-promo-tag">Bezpłatny okres próbny</div>
        <h3>Sprawdź AlertGA4 za darmo przez {TRIAL_DAYS} dni</h3>
        <p>Pełny dostęp na zasadach planu Agency — do 100 usług GA4. Bez podpinania karty, bez zobowiązań.</p>
        <Link href="/login" className="btn btn--primary">Rozpocznij bezpłatny okres próbny →</Link>
      </div>
    </div>
  )
}
