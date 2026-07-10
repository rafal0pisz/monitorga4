import Link from 'next/link'

interface Cta { href: string; label: string }

export default function LandingCtaBand({
  primaryCta, secondaryCta,
}: {
  primaryCta: Cta
  secondaryCta: Cta | null
}) {
  return (
    <section className="lp-cta-band">
      <svg className="lp-cta-chart" viewBox="0 0 1080 117" preserveAspectRatio="none" width="100%" height="117" aria-hidden="true">
        <polygon points="0,47 100,45 200,50 300,42 400,47 500,41 540,44 580,105 630,102 720,78 820,61 920,50 1020,44 1080,41 1080,117 0,117" fill="#fffd73" opacity="0.04" />
        <polyline points="0,47 100,45 200,50 300,42 400,47 500,41 540,44 580,105 630,102 720,78 820,61 920,50 1020,44 1080,41"
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="lp-cta-marker">
        <span className="lp-cta-marker-label">AlertGA4</span>
        <span className="lp-cta-marker-dot" />
      </div>
      <div className="wrap wrap--narrow">
        <h2>Zacznij monitorować poprawność danych w GA4</h2>
        <p>Logowanie kontem Google zajmuje mniej niż minutę.</p>
        <div className="lp-hero-ctas" style={{ justifyContent: 'center', marginBottom: 0 }}>
          <Link href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</Link>
          {secondaryCta && <Link href={secondaryCta.href} className="btn btn--ghost">{secondaryCta.label}</Link>}
        </div>
      </div>
    </section>
  )
}
