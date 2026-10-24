// Maps each translated marketing page to its Polish and English URL — used
// to build reciprocal hreflang alternates (see each page's metadata) and to
// let the language switcher jump to the actual equivalent page instead of
// always resetting to the homepage. Only pages that exist in both languages
// belong here; the blog stays Polish-only on purpose (see CLAUDE.md-adjacent
// session notes) and isn't listed.
export type Locale = 'pl' | 'en'

export interface LocaleRoute {
  pl: string
  en: string
}

export const LOCALE_ROUTES = {
  home:     { pl: '/',        en: '/en' },
  features: { pl: '/funkcje', en: '/en/features' },
  pricing:  { pl: '/cennik',  en: '/en/pricing' },
  contact:  { pl: '/kontakt', en: '/en/contact' },
  privacy:  { pl: '/privacy', en: '/en/privacy' },
  terms:    { pl: '/terms',   en: '/en/terms' },
} as const satisfies Record<string, LocaleRoute>

export type LocaleRouteKey = keyof typeof LOCALE_ROUTES
