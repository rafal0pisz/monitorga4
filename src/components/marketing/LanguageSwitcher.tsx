import Link from 'next/link'
import type { Locale, LocaleRoute, LocaleRouteKey } from '@/lib/i18n/routes'
import { LOCALE_ROUTES } from '@/lib/i18n/routes'

// Always-visible next to the CTA, never tucked into the nav's mobile menu —
// the user explicitly asked for the language choice to be immediately
// visible, not hidden. Text-only (no flags/pill): the flag-pill version
// broke the mobile nav layout (clipped logo, overlapping CTA), so this
// mirrors a compact "EN / PL" text pattern instead.
//
// `hrefs` overrides the LOCALE_ROUTES[routeKey] lookup — needed for a blog
// post, whose pl/en URLs depend on that specific post's slug/enSlug, not a
// fixed route shared across every page of a given kind.
export default function LanguageSwitcher({ lang, routeKey = 'home', hrefs: hrefsOverride }: { lang: Locale; routeKey?: LocaleRouteKey; hrefs?: LocaleRoute }) {
  const hrefs = hrefsOverride ?? LOCALE_ROUTES[routeKey]
  return (
    <div className="lang-switch" role="group" aria-label="Language / Język">
      <Link href={hrefs.pl} hrefLang="pl" className={`lang-switch-btn${lang === 'pl' ? ' active' : ''}`}>
        PL
      </Link>
      <span className="lang-switch-sep" aria-hidden="true">/</span>
      <Link href={hrefs.en} hrefLang="en" className={`lang-switch-btn${lang === 'en' ? ' active' : ''}`}>
        EN
      </Link>
    </div>
  )
}
