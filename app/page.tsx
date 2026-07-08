import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Continue with Google' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#111827' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 880, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>QS</div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AlertGA4</span>
        </div>
        <Link href={primaryCta.href} style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
          {primaryCta.label} →
        </Link>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, margin: '0 0 16px' }}>
          Know the moment your GA4 tracking breaks — not weeks later.
        </h1>
        <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.6, margin: '0 0 32px' }}>
          AlertGA4 continuously checks your Google Analytics 4 implementation for missing events, duplicate purchases,
          traffic anomalies and broken parameters, scores it out of 100, and emails you the moment something looks wrong —
          instead of you finding out from a client asking why their reports look empty.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 56 }}>
          <Link href={primaryCta.href} style={{ display: 'inline-block', backgroundColor: '#16a34a', color: '#fff', fontWeight: 600, padding: '11px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
            {primaryCta.label}
          </Link>
          <a href="#how-it-works" style={{ display: 'inline-block', color: '#111827', fontWeight: 600, padding: '11px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, border: '1px solid #e5e7eb' }}>
            How it works
          </a>
        </div>

        {/* How it works */}
        <section id="how-it-works" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', margin: '0 0 20px' }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gap: 20 }}>
            {[
              { n: '1', t: 'Sign in with your Google account', d: 'You authorize AlertGA4 with read-only access to Google Analytics — the same access level as a GA4 "Viewer" role. We never modify your GA4 property, its configuration, or its data.' },
              { n: '2', t: 'Add a GA4 property to monitor', d: 'Pick any GA4 property you already have Viewer access to. AlertGA4 runs a daily set of checks against it: expected events, ecommerce funnel, self-referrals, bot traffic, bounce anomalies and more.' },
              { n: '3', t: 'Get alerted before it matters', d: 'Each project gets a quality score and a trend. If the score drops below your threshold, AlertGA4 emails a plain-English summary of what broke — to you, and optionally to your client.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 14 }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.n}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{step.t}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data & permissions */}
        <section style={{ padding: '20px 22px', borderRadius: 12, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', margin: '0 0 12px' }}>
            Data &amp; permissions
          </h2>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 10px' }}>
            AlertGA4 requests a single, read-only Google API scope
            (<code style={{ fontSize: 12, background: '#eef2f0', padding: '1px 5px', borderRadius: 4 }}>analytics.readonly</code>)
            to read your GA4 property configuration and reporting data. We use it only to run the checks you configure and
            to display your results — we cannot and do not change anything in your Google Analytics account.
          </p>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
            See our <Link href="/privacy" style={{ color: '#16a34a' }}>Privacy Policy</Link> for full details on what we
            store and how, or <Link href="/terms" style={{ color: '#16a34a' }}>Terms of Service</Link> for the rest.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
          <span>© {new Date().getFullYear()} Bettersteps · AlertGA4</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Service</Link>
            <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#6b7280', textDecoration: 'none' }}>kontakt@bettersteps.pl</a>
            <a href="https://www.bettersteps.pl" style={{ color: '#6b7280', textDecoration: 'none' }}>www.bettersteps.pl</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
