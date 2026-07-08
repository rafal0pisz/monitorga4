import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — AlertGA4' }

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6 }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Last updated: 8 July 2026</p>

        <p style={p}>
          AlertGA4 is a Google Analytics 4 (GA4) implementation-monitoring service operated by Bettersteps
          (&ldquo;Bettersteps&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), available at alertga4.bettersteps.pl. This
          policy explains what data we collect when you use AlertGA4, why we collect it, and how it&apos;s handled.
        </p>

        <h2 style={h2}>1. What we collect</h2>
        <p style={p}>When you sign in with Google, we receive and store:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}><strong>Basic profile info</strong> — your name and email address, used to identify your account.</li>
          <li style={li}>
            <strong>An OAuth access token and refresh token</strong> scoped to{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>{' '}
            — Google&apos;s read-only Analytics scope. This is the same level of access as a GA4 &ldquo;Viewer&rdquo; role:
            it lets us read your GA4 property configuration and reporting data. It does <strong>not</strong> allow us to
            change, delete, or export raw event-level GA4 data outside of the aggregate metrics our checks compute.
          </li>
          <li style={li}>
            <strong>GA4 property data you choose to monitor</strong> — property IDs, and the aggregate check results
            (event counts, scores, pass/fail status) our automated checks compute from your GA4 reporting data.
          </li>
          <li style={li}>
            <strong>Configuration you enter</strong> — project names, custom event/parameter checks you define, alert
            thresholds, and any client email address you choose to send alerts to.
          </li>
        </ul>
        <p style={p}>We do not request or use any other Google API scope, and we never ask for your Google password.</p>

        <h2 style={h2}>2. How we use it</h2>
        <p style={p}>We use this data solely to operate AlertGA4:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Running the daily and on-demand quality checks you configure against your GA4 property.</li>
          <li style={li}>Computing an implementation quality score and showing it on your dashboard.</li>
          <li style={li}>Sending you (and, for per-project alerts, the client email address you configure) an email when a project&apos;s score drops below its threshold, or a daily summary digest.</li>
          <li style={li}>Refreshing your Google access token automatically so scheduled checks can run without asking you to sign in every day.</li>
        </ul>
        <p style={p}>We do not use your data for advertising, do not build behavioral profiles from it, and do not sell it.</p>

        <h2 style={h2}>3. Who can see your data</h2>
        <p style={p}>
          Projects, their configuration, and their check history are private to the Google account that created them.
          Other AlertGA4 users — including other people signed in to the app — cannot see your projects, your GA4 data,
          or your stored Google tokens. Access is enforced at the database level (row-level security), not just in the
          application UI.
        </p>

        <h2 style={h2}>4. Third parties we rely on</h2>
        <p style={p}>To operate the service, we use the following subprocessors, each only for the stated purpose:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}><strong>Google</strong> — authentication (Sign in with Google) and the GA4 Data/Admin APIs your checks read from.</li>
          <li style={li}><strong>Supabase</strong> — our database and authentication provider; stores your account, project configuration, and OAuth tokens.</li>
          <li style={li}><strong>Vercel</strong> — hosts the AlertGA4 application.</li>
          <li style={li}><strong>Resend</strong> — delivers the transactional email alerts and digests AlertGA4 sends.</li>
        </ul>
        <p style={p}>None of these providers are permitted to use your data for their own purposes.</p>

        <h2 style={h2}>5. Data retention &amp; deletion</h2>
        <p style={p}>
          We retain your account and project data for as long as your account is active. Deleting a project from
          AlertGA4 immediately and permanently deletes its configuration and check history. You can revoke AlertGA4&apos;s
          access to your Google account at any time from{' '}
          <a href="https://myaccount.google.com/permissions" style={{ color: '#16a34a' }}>Google Account permissions</a>.
          To request full deletion of your AlertGA4 account and all associated data, email{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>.
        </p>

        <h2 style={h2}>6. Security</h2>
        <p style={p}>
          OAuth tokens and project data are stored in an access-controlled database and are never exposed to the
          browser beyond what&apos;s needed to render your own projects. All traffic to AlertGA4 is encrypted with HTTPS.
        </p>

        <h2 style={h2}>7. Children</h2>
        <p style={p}>AlertGA4 is a business tool and is not directed at, or knowingly used by, children under 16.</p>

        <h2 style={h2}>8. Changes to this policy</h2>
        <p style={p}>
          If we make material changes to this policy, we&apos;ll update the date at the top of this page. Continued use
          of AlertGA4 after a change constitutes acceptance of the updated policy.
        </p>

        <h2 style={h2}>9. Contact</h2>
        <p style={p}>
          Questions about this policy or your data: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={{ color: '#16a34a' }}>www.bettersteps.pl</a>
        </p>
      </main>
    </div>
  )
}
