'use client'

import { useState } from 'react'
import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'
import LanguageSwitcher from '@/components/marketing/LanguageSwitcher'
import type { Locale, LocaleRouteKey } from '@/lib/i18n/routes'

interface Cta { href: string; label: string }

const NAV_LINKS_PL = [
  { href: '/#jak-to-dziala', label: 'Proces' },
  { href: '/#co-sprawdzamy', label: 'Monitoring' },
  { href: '/#dla-kogo', label: 'Dla kogo' },
  { href: '/funkcje', label: 'Funkcje' },
  { href: '/cennik', label: 'Cennik' },
  { href: '/kontakt', label: 'Kontakt' },
]

const NAV_LINKS_EN = [
  { href: '/en#how-it-works', label: 'Process' },
  { href: '/en#what-we-check', label: 'Monitoring' },
  { href: '/en#who-its-for', label: "Who it's for" },
  { href: '/en/features', label: 'Features' },
  { href: '/en/pricing', label: 'Pricing' },
  { href: '/en/contact', label: 'Contact' },
]

const STRINGS = {
  pl: { ariaMain: 'Główna', openMenu: 'Otwórz menu', closeMenu: 'Zamknij menu', signUpShort: 'Zarejestruj się' },
  en: { ariaMain: 'Main', openMenu: 'Open menu', closeMenu: 'Close menu', signUpShort: 'Sign up' },
}

export default function LandingNav({
  primaryCta, user, lang = 'pl', routeKey = 'home',
}: {
  primaryCta: Cta
  user: boolean
  lang?: Locale
  routeKey?: LocaleRouteKey
}) {
  const [open, setOpen] = useState(false)
  const t = STRINGS[lang]
  const baseLinks = lang === 'en' ? NAV_LINKS_EN : NAV_LINKS_PL
  const homeHref = lang === 'en' ? '/en' : '/'
  // Demo Dashboard sits with the rest of the nav links (next to Kontakt) as
  // a plain, unhighlighted link — only shown to visitors who don't already
  // have the real thing. The dashboard itself is already English-only, so
  // the link and its label need no translation in either language.
  const navLinks = user ? baseLinks : [...baseLinks, { href: '/demo', label: 'Demo Dashboard' }]

  return (
    <nav className="lp-nav" aria-label={t.ariaMain}>
      <div className="wrap lp-nav-row">
        <Link href={homeHref} style={{ textDecoration: 'none' }} onClick={() => setOpen(false)}>
          <BrandWordmark size={19} dark />
        </Link>
        <div className="lp-nav-links">
          {navLinks.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
        <div className="lp-nav-cta">
          <LanguageSwitcher lang={lang} routeKey={routeKey} />
          <Link href={primaryCta.href} className="btn btn--primary btn--sm">
            <span className="nav-cta-full">{primaryCta.label}</span>
            <span className="nav-cta-short">{user ? primaryCta.label : t.signUpShort}</span>
          </Link>
          <button
            type="button"
            className="lp-nav-hamburger"
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <span style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ opacity: open ? 0 : 1 }} />
            <span style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </div>

      {open && (
        <div className="lp-nav-mobile">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div className="lp-nav-mobile-cta">
            <Link href={primaryCta.href} className="btn btn--primary" onClick={() => setOpen(false)}>{primaryCta.label}</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
