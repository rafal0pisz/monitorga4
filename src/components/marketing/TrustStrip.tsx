import type { Locale } from '@/lib/i18n/routes'

// Wariant A from the pricing-page design session: a centered row of pills —
// no scrolling/JS needed, three short items always fit on one line down to
// phone width's CSS stack (see .lp-trust-strip-track's mobile breakpoint in
// landingStyles.ts). Shared between /cennik (below the plan comparison
// table) and the homepage (below "Jak to działa") so the two can't silently
// drift on wording — same for the /en equivalents.
const ITEMS_PL = [
  {
    title: 'Dostęp tylko do odczytu',
    sub: 'Read-only access Google',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Zgodność z RODO',
    sub: 'Przetwarzanie danych zgodne z GDPR',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5v6c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Zweryfikowani przez Google',
    sub: 'Zgodność z Google API Services User Data Policy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 12 3 3 5-6" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
]

const ITEMS_EN = [
  {
    title: 'Read-only access',
    sub: 'We can never change anything in your GA4 account',
    icon: ITEMS_PL[0].icon,
  },
  {
    title: 'GDPR compliant',
    sub: 'Data processing compliant with the GDPR',
    icon: ITEMS_PL[1].icon,
  },
  {
    title: 'Verified by Google',
    sub: 'Compliant with the Google API Services User Data Policy',
    icon: ITEMS_PL[2].icon,
  },
]

export default function TrustStrip({ lang = 'pl' }: { lang?: Locale }) {
  const items = lang === 'en' ? ITEMS_EN : ITEMS_PL
  return (
    <div className="lp-trust-strip">
      <div className="wrap">
        <div className="lp-trust-strip-track">
          {items.map(item => (
            <div className="lp-trust-chip" key={item.title}>
              {item.icon}
              <span>
                <span className="t">{item.title}</span>
                <span className="s">{item.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
