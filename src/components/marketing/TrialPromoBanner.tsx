import Link from 'next/link'
import { TRIAL_DAYS } from '@/lib/billing/plans'
import type { Locale } from '@/lib/i18n/routes'

const STRINGS = {
  pl: {
    h: <>{TRIAL_DAYS} dni za darmo. <em>Bez karty.</em> Bez zobowiązań.</>,
    p: 'Pełny dostęp do AlertGA4 na zasadach planu Pro — do 15 monitorowanych usług GA4.',
    cta: 'Rozpocznij bezpłatny okres próbny →',
  },
  en: {
    h: <>{TRIAL_DAYS} days free. <em>No card.</em> No commitment.</>,
    p: 'Full access to AlertGA4 on Pro plan terms, up to 15 monitored GA4 properties.',
    cta: 'Start your free trial →',
  },
}

// Same offer as .trial-banner-guest (see app/page.tsx, app/cennik/page.tsx)
// but set as a plain typographic statement — no card, no background —
// rather than a boxed ad block. See landingStyles.ts's .trial-promo-banner.
// Render it only for guests: `{!user && <TrialPromoBanner />}`.
export default function TrialPromoBanner({ lang = 'pl' }: { lang?: Locale }) {
  const t = STRINGS[lang]
  return (
    <div className="trial-promo-banner">
      <h3>{t.h}</h3>
      <p>{t.p}</p>
      <Link href="/login" className="trial-promo-link">{t.cta}</Link>
    </div>
  )
}
