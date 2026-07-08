import Link from 'next/link'

export const metadata = { title: 'Terms of Service — AlertGA4' }

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6 }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Last updated: 8 July 2026</p>

        <p style={p}>
          These terms govern your use of AlertGA4, a Google Analytics 4 (GA4) implementation-monitoring service
          operated by Bettersteps (&ldquo;Bettersteps&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) at alertga4.bettersteps.pl.
          By signing in and using AlertGA4, you agree to these terms.
        </p>

        <h2 style={h2}>1. The service</h2>
        <p style={p}>
          AlertGA4 connects to a GA4 property you have access to, using read-only Google API access, and runs
          automated checks against its configuration and reporting data to produce a quality score, trend, and email
          alerts. AlertGA4 never modifies your GA4 property, its configuration, or its underlying data — all access
          is read-only.
        </p>

        <h2 style={h2}>2. Your account and access</h2>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>You must sign in with a Google account that has legitimate (at least Viewer-level) access to any GA4 property you add.</li>
          <li style={li}>You are responsible for the projects, configuration, and alert recipients you set up under your account.</li>
          <li style={li}>You may not use AlertGA4 to access, or attempt to access, a GA4 property you are not authorized to view.</li>
        </ul>

        <h2 style={h2}>3. Acceptable use</h2>
        <p style={p}>You agree not to:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Reverse engineer, scrape, or attempt to circumvent access controls of the service.</li>
          <li style={li}>Use AlertGA4 to store or process data you are not authorized to hold.</li>
          <li style={li}>Interfere with the service&apos;s availability or abuse its automated checks (e.g. excessive manual runs intended to overload the Google APIs).</li>
        </ul>

        <h2 style={h2}>4. Availability</h2>
        <p style={p}>
          AlertGA4 is provided on a best-effort basis. Daily automated checks and email alerts depend on Google&apos;s
          APIs, our hosting and email providers, and your Google account remaining connected — we do not guarantee
          uninterrupted availability and are not liable for missed alerts caused by factors outside our control.
        </p>

        <h2 style={h2}>5. No warranty</h2>
        <p style={p}>
          AlertGA4 is provided &ldquo;as is&rdquo;, without warranties of any kind. Quality scores and check results are
          informational aids, not a guarantee of GA4 data accuracy or completeness — you remain responsible for
          verifying your own analytics implementation.
        </p>

        <h2 style={h2}>6. Limitation of liability</h2>
        <p style={p}>
          To the maximum extent permitted by law, Bettersteps is not liable for indirect, incidental, or consequential
          damages arising from your use of, or inability to use, AlertGA4, including decisions made based on its
          check results or alerts.
        </p>

        <h2 style={h2}>7. Termination</h2>
        <p style={p}>
          You may stop using AlertGA4 and delete your projects at any time from the project settings page, and may
          revoke its access to your Google account from{' '}
          <a href="https://myaccount.google.com/permissions" style={{ color: '#16a34a' }}>Google Account permissions</a>{' '}
          at any time. We may suspend or terminate access for accounts that violate section 3.
        </p>

        <h2 style={h2}>8. Changes to these terms</h2>
        <p style={p}>
          We may update these terms from time to time; we&apos;ll update the date at the top of this page when we do.
          Continued use of AlertGA4 after a change constitutes acceptance of the updated terms.
        </p>

        <h2 style={h2}>9. Governing law</h2>
        <p style={p}>These terms are governed by the laws of Poland.</p>

        <h2 style={h2}>10. Contact</h2>
        <p style={p}>
          Questions about these terms: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={{ color: '#16a34a' }}>www.bettersteps.pl</a>
        </p>

        <p style={{ ...p, marginTop: 24 }}>
          See also our <Link href="/privacy" style={{ color: '#16a34a' }}>Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}
