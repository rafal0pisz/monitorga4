import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'

interface Cta { href: string; label: string }

export default function LandingNav({
  primaryCta, secondaryCta, user,
}: {
  primaryCta: Cta
  secondaryCta: Cta | null
  user: boolean
}) {
  return (
    <nav className="lp-nav" aria-label="Główna">
      <div className="wrap lp-nav-row">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <BrandWordmark size={19} dark />
        </Link>
        <div className="lp-nav-links">
          <a href="/#jak-to-dziala">Proces</a>
          <a href="/#co-sprawdzamy">Monitoring</a>
          <Link href="/funkcje">Funkcje</Link>
          <a href="/#dla-kogo">Dla kogo</a>
        </div>
        <div className="lp-nav-cta">
          {secondaryCta && <Link href={secondaryCta.href} className="login-link">{secondaryCta.label}</Link>}
          <Link href={primaryCta.href} className="btn btn--primary btn--sm">
            <span className="nav-cta-full">{primaryCta.label}</span>
            <span className="nav-cta-short">{user ? primaryCta.label : 'Zarejestruj się'}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
