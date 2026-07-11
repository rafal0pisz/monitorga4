'use client'

import { useState } from 'react'
import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'

interface Cta { href: string; label: string }

const NAV_LINKS = [
  { href: '/#jak-to-dziala', label: 'Proces' },
  { href: '/#co-sprawdzamy', label: 'Monitoring' },
  { href: '/#dla-kogo', label: 'Dla kogo' },
  { href: '/funkcje', label: 'Funkcje' },
  { href: '/cennik', label: 'Cennik' },
  { href: '/kontakt', label: 'Kontakt' },
]

export default function LandingNav({
  primaryCta, secondaryCta, user,
}: {
  primaryCta: Cta
  secondaryCta: Cta | null
  user: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="lp-nav" aria-label="Główna">
      <div className="wrap lp-nav-row">
        <Link href="/" style={{ textDecoration: 'none' }} onClick={() => setOpen(false)}>
          <BrandWordmark size={19} dark />
        </Link>
        <div className="lp-nav-links">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
        <div className="lp-nav-cta">
          {secondaryCta && <Link href={secondaryCta.href} className="login-link">{secondaryCta.label}</Link>}
          <Link href={primaryCta.href} className="btn btn--primary btn--sm">
            <span className="nav-cta-full">{primaryCta.label}</span>
            <span className="nav-cta-short">{user ? primaryCta.label : 'Zarejestruj się'}</span>
          </Link>
          <button
            type="button"
            className="lp-nav-hamburger"
            aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
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
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div className="lp-nav-mobile-cta">
            {secondaryCta && <Link href={secondaryCta.href} onClick={() => setOpen(false)}>{secondaryCta.label}</Link>}
            <Link href={primaryCta.href} className="btn btn--primary" onClick={() => setOpen(false)}>{primaryCta.label}</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
