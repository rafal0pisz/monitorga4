import type { Metadata } from 'next'
import Link from 'next/link'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'

const TITLE = 'Privacy Policy'
const DESCRIPTION = 'What data AlertGA4 collects, for what purpose, and how it stores it — a full, GDPR-compliant privacy policy.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/en/privacy',
    languages: { 'pl': '/privacy', 'en': '/en/privacy' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/en/privacy',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
}

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6, paddingLeft: 4 }
const ul: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'disc' }
const ol: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'decimal' }
const link: React.CSSProperties = { color: '#16a34a' }

export default function PrivacyPageEn() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <SetHtmlLang lang="en" />
      <style>{`.legal-doc li::marker { color: #16a34a; font-weight: 600; }`}</style>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/en" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
        <Link href="/privacy" hrefLang="pl" style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}>← Wersja polska</Link>
      </header>

      <main className="legal-doc" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Last updated: October 20, 2026</p>

        <h2 style={h2}>I. Definitions</h2>
        <p style={p}>Capitalized terms have the meaning given to them in the <Link href="/en/terms" style={link}>Terms of Service</Link>, unless this Policy states otherwise.</p>

        <h2 style={h2}>II. Data controller</h2>
        <ol style={ol}>
          <li style={li}>The controller of personal data processed in connection with the use of the AlertGA4 Service is:</li>
        </ol>
        <p style={{ ...p, padding: '14px 16px', borderRadius: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <strong>Bettersteps spółka z ograniczoną odpowiedzialnością</strong><br />
          ul. Domaniewska 47, 02-672 Warsaw, Poland<br />
          KRS: 0001011888 · NIP (Polish tax ID): 5214000359 · REGON: 524154200<br />
          Email: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>
        </p>
        <p style={p}>The Operator has not formally appointed a Data Protection Officer. For all matters relating to personal data protection, please contact <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a> directly.</p>

        <h2 style={h2}>III. What data we collect</h2>
        <p style={p}>When you sign in with a Google account, we receive and store:</p>
        <ul style={ul}>
          <li style={li}><strong>Basic profile data</strong> — your name and email address, used to identify your Account.</li>
          <li style={li}>
            <strong>An OAuth access token and refresh token</strong>, scoped to{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>{' '}
            — read-only access to Google Analytics (the "Viewer" role). This does not let us change, delete or export
            the raw event data of your GA4 property beyond the aggregated metrics our checks calculate.
          </li>
          <li style={li}><strong>Data of the GA4 property you choose to monitor</strong> — property identifiers and aggregated check results (event counts, the quality score, pass/warn/fail status).</li>
          <li style={li}><strong>Configuration you enter yourself</strong> — Project names, the event and parameter checks you define, alert thresholds, and the email addresses of alert recipients.</li>
          <li style={li}><strong>Billing data</strong> — when you purchase a Subscription Plan, the data needed to process payment and issue an invoice, processed in that scope by Stripe as an independent controller (card data never reaches our servers).</li>
          <li style={li}><strong>Technical data</strong> — IP addresses and request timestamps, processed by our hosting provider (Vercel) for security, diagnostics and abuse prevention, under their own retention policies.</li>
        </ul>
        <p style={p}>We do not request any other scope of access to Google APIs, and we never ask for your Google account password.</p>
        <p style={p}>
          <strong>Data of third parties you name.</strong> If you name another person's email address (e.g. a client's or a colleague's)
          as the alert recipient for a given Project, we process that address solely to send notifications about that Project.
          You are responsible for having a legal basis to give us that address — see chapter VIII of the{' '}
          <Link href="/en/terms" style={link}>Terms of Service</Link>.
        </p>

        <h2 style={h2}>IV. Purposes and legal bases for processing</h2>
        <p style={p}>We use the data above solely to operate the Service:</p>
        <ul style={ul}>
          <li style={li}>running the daily and manual quality checks configured for your GA4 property;</li>
          <li style={li}>calculating your implementation's quality score and showing it in the dashboard;</li>
          <li style={li}>sending email alerts (to you and, for per-project alerts, to a configured recipient address) when the score drops below a set threshold, plus a daily combined summary;</li>
          <li style={li}>automatically refreshing the Google access token, so scheduled checks keep working without you having to sign in again;</li>
          <li style={li}>handling payments and billing for the Subscription Plan you chose;</li>
          <li style={li}>handling requests and complaints sent to kontakt@bettersteps.pl.</li>
        </ul>
        <p style={p}>We do not use your data for advertising purposes, we do not build behavioral profiles from it, and we do not sell it.</p>
        <p style={p}>The legal basis for processing is:</p>
        <ul style={ul}>
          <li style={li}>performance of the contract to provide the Service (GDPR Art. 6(1)(b)) — for operating the Service and billing;</li>
          <li style={li}>our legitimate interest in ensuring security, the Service's correct operation, and pursuing any claims (GDPR Art. 6(1)(f));</li>
          <li style={li}>a legal obligation on the Operator (GDPR Art. 6(1)(c)) — to the extent tax and accounting law requires keeping billing records.</li>
        </ul>

        <h2 style={h2}>V. Who has access to your data</h2>
        <p style={p}>
          Projects, their configuration and check history are private to the Google account that created them. Other AlertGA4
          users — even while signed in — cannot see your Projects, your GA4 data, or your stored Google tokens. Access is
          enforced at the database level (row-level security), not just in the application's interface.
        </p>
        <p style={p}>
          If you use the public link-sharing feature for a report (the /share/[token] page), anyone holding that link can
          view the report it contains without signing in. You are responsible for who you give that link to.
        </p>

        <h2 style={h2}>VI. Entities processing data on our behalf (subprocessors)</h2>
        <p style={p}>To run the Service we use the following subprocessors, each solely for the purpose stated:</p>
        <ul style={ul}>
          <li style={li}><strong>Google</strong> — sign-in ("Sign in with Google") and the GA4 API (Data/Admin), which we read your property's data from.</li>
          <li style={li}><strong>Supabase</strong> — our database and authentication provider; stores your Account, Project configuration, and OAuth tokens.</li>
          <li style={li}><strong>Vercel</strong> — hosting for the AlertGA4 Service.</li>
          <li style={li}><strong>Resend</strong> — delivery of emails (alerts, summaries) sent by the Service.</li>
          <li style={li}><strong>Stripe</strong> — payment and billing processing for paid Subscription Plans.</li>
        </ul>
        <p style={p}>None of these providers is authorized to use your data for its own purposes. We will update this Policy if this list changes materially.</p>
        <p style={p}>
          Our use and transfer of information received from Google APIs adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" style={link}>Google API Services User Data Policy</a>,
          including the Limited Use requirements: data read from your GA4 property is used solely for the functions described
          in this policy, is never used to train machine learning models or for advertising purposes, is never sold or shared
          with unauthorized third parties, and is accessible only to people who need it to maintain the Service.
        </p>

        <h2 style={h2}>VII. Transfers outside the European Economic Area</h2>
        <p style={p}>
          Some of the subprocessors listed above (including Vercel, Resend and Stripe) may process data on servers located
          outside the European Economic Area, including in the United States. Such transfers rely on GDPR-compliant
          mechanisms — in particular the standard contractual clauses approved by the European Commission (GDPR Art. 46(2)(c))
          or European Commission adequacy decisions (GDPR Art. 45). Information about the safeguards applied, and a copy of
          data transferred to third countries, can be obtained by contacting{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.
        </p>

        <h2 style={h2}>VIII. Cookies</h2>
        <p style={p}>The Service uses cookies in the following categories:</p>
        <ul style={ul}>
          <li style={li}><strong>Necessary</strong> — required for the Service to work, in particular the cookie that keeps a signed-in User's session (authentication via Supabase). Without these, signing in and using the Service is not possible.</li>
          <li style={li}><strong>Analytics</strong> — used to measure traffic and how the Service is used, set via Google Tag Manager.</li>
          <li style={li}><strong>Marketing</strong> — used to measure the effectiveness of advertising and to show content matched to the User's interests.</li>
          <li style={li}><strong>Functional</strong> — remember the User's choices and preferences, including their cookie-consent decision.</li>
        </ul>
        <p style={p}>
          Necessary cookies, being required to provide the service the User requested, do not require consent under Art. 173(3)(2)
          of the Polish Telecommunications Law. Analytics, marketing and functional cookies are installed only after the User
          consents, via the banner shown on their first visit. Consent can be withdrawn or changed at any time, either in the
          settings available in the Service's footer ("Cookie settings") or directly in the browser's own settings.
        </p>
        <p style={p}>Disabling cookies in the browser will prevent signing in to, and using, the Service.</p>

        <h2 style={h2}>IX. Retention and deletion of data</h2>
        <p style={p}>
          We keep Account and Project data for as long as the Account stays active. Deleting a Project immediately and
          permanently erases its configuration and check history. You can revoke AlertGA4's access to your Google account
          at any time in your{' '}
          <a href="https://myaccount.google.com/permissions" style={link}>Google account settings</a>.
          To request complete deletion of your Account and all associated data, write to{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>. Billing data is kept for the
          period required by tax and accounting law.
        </p>
        <p style={p}>For data with a narrow, predefined purpose, we use shorter, automatic retention periods:</p>
        <ul style={ul}>
          <li style={li}>
            <strong>Check history and sent-alert logs</strong> — deleted automatically 40 days after the check ran or the
            alert was sent; this covers the longest range the app actually uses (trend comparisons and the history shown
            in the dashboard).
          </li>
          <li style={li}>
            <strong>Contact-form submissions</strong> (IP address, solely to limit abuse) — deleted automatically after 7 days.
          </li>
          <li style={li}>
            <strong>Trial cancellation survey responses</strong> — deleted automatically after 180 days.
          </li>
        </ul>

        <h2 style={h2}>X. Your rights</h2>
        <p style={p}>Under the GDPR you have the right to:</p>
        <ul style={ul}>
          <li style={li}>access your data and receive a copy of it,</li>
          <li style={li}>have inaccurate data corrected,</li>
          <li style={li}>erasure of your data ("the right to be forgotten"),</li>
          <li style={li}>restriction of processing,</li>
          <li style={li}>data portability,</li>
          <li style={li}>object to processing based on our legitimate interest,</li>
          <li style={li}>lodge a complaint with the Polish data protection authority (Prezes Urzędu Ochrony Danych Osobowych, UODO), or with your own country's supervisory authority.</li>
        </ul>
        <p style={p}>To exercise these rights, write to <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.</p>

        <h2 style={h2}>XI. Security</h2>
        <p style={p}>
          OAuth tokens and Project data are stored in an access-controlled database and are never exposed in the browser
          beyond what's needed to display your own Projects. All traffic to the Service is encrypted via HTTPS.
        </p>

        <h2 style={h2}>XII. Children</h2>
        <p style={p}>AlertGA4 is a business tool and is not directed at, or knowingly used by, anyone under 16 years of age.</p>

        <h2 style={h2}>XIII. Changes to this policy</h2>
        <p style={p}>
          If we make material changes to this Policy, we will update the date at the top of this page and, where feasible,
          notify Users electronically. Continued use of the Service after changes take effect constitutes acceptance of them.
        </p>

        <h2 style={h2}>XIV. Contact</h2>
        <p style={p}>
          Questions about this Policy or your data: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={link}>www.bettersteps.pl</a>
        </p>
      </main>
    </div>
  )
}
