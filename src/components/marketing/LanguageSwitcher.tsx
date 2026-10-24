import Link from 'next/link'
import type { Locale, LocaleRouteKey } from '@/lib/i18n/routes'
import { LOCALE_ROUTES } from '@/lib/i18n/routes'

// Always-visible segmented toggle, not tucked into the nav's mobile menu —
// the user explicitly asked for the language choice to be immediately
// visible, not hidden. Flags are flat SVG shapes rather than emoji: flag
// emoji render as a two-letter code instead of a flag on Windows, which
// looks broken on a B2B site.
function FlagPL() {
  return (
    <svg viewBox="0 0 20 13" width="18" height="12" aria-hidden="true" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="6.5" fill="#fff" />
      <rect y="6.5" width="20" height="6.5" fill="#dc143c" />
    </svg>
  )
}

function FlagEN() {
  return (
    <svg viewBox="0 0 20 13" width="18" height="12" aria-hidden="true" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="20" height="13" fill="#00247d" />
      <path d="M0,0 L20,13 M20,0 L0,13" stroke="#fff" strokeWidth="2.6" />
      <path d="M0,0 L20,13 M20,0 L0,13" stroke="#cf142b" strokeWidth="1.1" />
      <path d="M10,0 V13 M0,6.5 H20" stroke="#fff" strokeWidth="4.2" />
      <path d="M10,0 V13 M0,6.5 H20" stroke="#cf142b" strokeWidth="2.1" />
    </svg>
  )
}

export default function LanguageSwitcher({ lang, routeKey }: { lang: Locale; routeKey: LocaleRouteKey }) {
  const hrefs = LOCALE_ROUTES[routeKey]
  return (
    <div className="lang-switch" role="group" aria-label="Language / Język">
      <Link href={hrefs.pl} hrefLang="pl" className={`lang-switch-btn${lang === 'pl' ? ' active' : ''}`}>
        <FlagPL />PL
      </Link>
      <Link href={hrefs.en} hrefLang="en" className={`lang-switch-btn${lang === 'en' ? ' active' : ''}`}>
        <FlagEN />EN
      </Link>
    </div>
  )
}
