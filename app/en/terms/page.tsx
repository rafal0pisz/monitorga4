import type { Metadata } from 'next'
import Link from 'next/link'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'

const TITLE = 'Terms of Service'
const DESCRIPTION = 'AlertGA4 Terms of Service — definitions, registration rules, plans and billing, service availability, liability, complaints.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/en/terms',
    languages: { 'pl': '/terms', 'en': '/en/terms' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/en/terms',
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
const ol: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'decimal' }
const olAlpha: React.CSSProperties = { ...ol, listStyleType: 'lower-alpha' }
const link: React.CSSProperties = { color: '#16a34a' }

export default function TermsPageEn() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <SetHtmlLang lang="en" />
      <style>{`.legal-doc li::marker { color: #16a34a; font-weight: 600; }`}</style>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/en" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
        <Link href="/terms" hrefLang="pl" style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}>← Wersja polska</Link>
      </header>

      <main className="legal-doc" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Last updated: October 18, 2026</p>

        <h2 style={h2}>I. Definitions</h2>
        <ol style={ol}>
          <li style={li}><strong>Operator</strong> — Bettersteps spółka z ograniczoną odpowiedzialnością (a Polish limited liability company), with its registered office in Warsaw, ul. Domaniewska 47, 02-672 Warsaw, Poland, entered in the Polish National Court Register (KRS) under number 0001011888, Tax ID (NIP): 5214000359, REGON: 524154200.</li>
          <li style={li}><strong>Service</strong> — the AlertGA4 website operating at alertga4.pl, run by the Operator.</li>
          <li style={li}><strong>Service(s) provided</strong> — the Google Analytics 4 (GA4) implementation quality monitoring service provided through the Service, consisting of automatic and manual verification of a designated GA4 property's configuration and reporting data, calculating a quality score, and sending email alerts.</li>
          <li style={li}><strong>User</strong> — a natural person, legal entity, or organizational unit without legal personality that is granted legal capacity by statute, using the Service under these Terms.</li>
          <li style={li}><strong>Account</strong> — the space in the Service tied to the User's Google account, together with the Projects created and their configuration.</li>
          <li style={li}><strong>Project</strong> — a single GA4 property added by the User for monitoring, along with its configuration (name, defined checks, alert thresholds, alert recipients).</li>
          <li style={li}><strong>Trial Period</strong> — a free, one-time trial period for an Account, shown at alertga4.pl/en/pricing, provided on Pro-plan terms, with no payment card required.</li>
          <li style={li}><strong>Subscription Plan</strong> — a paid tier of using the Account (Lite, Pro or Agency), differing among other things in the limit on monitored GA4 properties, described in detail at alertga4.pl/en/pricing.</li>
          <li style={li}><strong>Billing Period</strong> — the monthly or yearly period for which the Subscription Fee is charged, according to the User's choice when purchasing the Subscription Plan.</li>
          <li style={li}><strong>Subscription Fee</strong> — the fee for using the Account under the chosen Subscription Plan, in the amount stated in the Pricing page.</li>
          <li style={li}><strong>Pricing</strong> — the Service's current pricing, available at alertga4.pl/en/pricing.</li>
          <li style={li}><strong>Terms</strong> — these terms of service.</li>
        </ol>

        <h2 style={h2}>II. General provisions</h2>
        <ol style={ol}>
          <li style={li}>These Terms set out the rules for using the Service and the Services provided, and the rights and obligations of the Operator and the User.</li>
          <li style={li}>The owner of the Service and the entity providing the Services is the Operator.</li>
          <li style={li}>
            AlertGA4 connects to the GA4 property indicated by the User on a read-only basis only (the scope{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>,{' '}
            corresponding to the "Viewer" role in GA4), and on that basis:
            <ol type="a" style={{ ...olAlpha, marginTop: 6 }}>
              <li style={li}>runs automatic (daily) and manual checks of the Project's configuration and reporting data;</li>
              <li style={li}>calculates an implementation quality score and its trend over time based on them;</li>
              <li style={li}>sends a daily email summary of the result and any detected issues; the User may, in the Project's settings, limit this to only the days a check found a warning or an error.</li>
            </ol>
          </li>
          <li style={li}>AlertGA4 never modifies, deletes or exports raw event data from the User's GA4 property beyond the aggregated metrics calculated for its own checks. The Operator's access to the User's GA4 property is read-only only.</li>
          <li style={li}>Using the Service requires reading and accepting these Terms.</li>
          <li style={li}>The Operator makes efforts to keep data transmission within the Service secure; all traffic to the Service is encrypted via HTTPS.</li>
          <li style={li}>The Operator is not liable for problems arising from the User's own hardware or software (e.g. an outdated browser) that prevent use of the Service.</li>
        </ol>

        <h2 style={h2}>III. Registration and account access</h2>
        <ol style={ol}>
          <li style={li}>Access to the Service requires signing in with a Google account. The Service does not offer registration with a login and password, nor anonymous sign-in.</li>
          <li style={li}>To add a Project, the User must hold at least "Viewer"-level permissions on the corresponding GA4 property in Google Analytics. The User is prohibited from using the Service to obtain, or attempt to obtain, access to a GA4 property they are not authorized to access.</li>
          <li style={li}>The User is responsible for configuring their Projects, including the accuracy of the alert-recipient email addresses they enter themselves.</li>
          <li style={li}>After first sign-in, the User is given a one-time, 14-day Trial Period on Pro-plan terms, with no payment card required. After it ends, continued use of the Account requires purchasing a Subscription Plan.</li>
          <li style={li}>The Operator reserves the right to block access to an Account in case of a reasonable suspicion of a breach of these Terms, in particular providing false information or violating the rules described in chapter IV.</li>
        </ol>

        <h2 style={h2}>IV. Rules of using the Service</h2>
        <p style={p}>The User agrees that they will not:</p>
        <ol type="a" style={olAlpha}>
          <li style={li}>attempt to reverse-engineer, scan, or bypass the Service's access-control mechanisms;</li>
          <li style={li}>use the Service to process data they are not authorized to access, including someone else's GA4 property;</li>
          <li style={li}>disrupt the Service's availability or abuse the manual check-run feature in a way that excessively burdens the Operator's infrastructure or Google's API limits;</li>
          <li style={li}>use the Service in a way that violates applicable law or infringes third-party rights;</li>
          <li style={li}>share their Account access with third parties in a way inconsistent with the chosen Subscription Plan.</li>
        </ol>
        <p style={p}>Violating the above rules entitles the Operator to block access to the Account with immediate effect, with no refund for the unused part of the Billing Period.</p>

        <h2 style={h2}>V. Plans, fees and billing</h2>
        <ol style={ol}>
          <li style={li}>Using the Service after the Trial Period ends is paid, according to the chosen Subscription Plan (Lite, Pro or Agency), which differ in the limit on monitored Projects. Current limits and prices are shown on the Pricing page.</li>
          <li style={li}>Fees are billed monthly or yearly, as chosen by the User, in advance for the given Billing Period.</li>
          <li style={li}>Payments are handled by Stripe. By paying with a card, the User agrees to automatic subscription renewal and the Subscription Fee being charged for subsequent Billing Periods, until the subscription is cancelled.</li>
          <li style={li}>The User manages their own subscription — changing the Subscription Plan, changing the payment method, and cancelling the subscription are done through the payment management portal (the Stripe Customer Portal), available from the Account settings.</li>
          <li style={li}>Cancelling a subscription stops further charges from the next Billing Period onward; the Account keeps its current Subscription Plan until the end of the paid Billing Period. The User is not entitled to a refund for the unused part of a Billing Period.</li>
          <li style={li}>The Operator will inform Users of Pricing changes in advance, electronically; changes take effect from the next Billing Period. Not cancelling the Service within 14 days of being notified of a price change is treated as accepting it.</li>
        </ol>

        <h2 style={h2}>VI. Service availability and technical interruptions</h2>
        <ol style={ol}>
          <li style={li}>The Operator makes reasonable efforts to keep the Service running continuously but does not guarantee uninterrupted availability. Daily automatic checks and email alerts depend on the availability of Google's API and of the Operator's infrastructure providers (hosting, database, email delivery).</li>
          <li style={li}>The Operator reserves the right to temporary technical interruptions to the Service, in particular for maintenance or updates. The Operator makes efforts to keep such interruptions as short as possible.</li>
          <li style={li}>The Operator is not liable for failure or improper performance of the Service caused by third parties (including Google, hosting and email providers, and telecommunications operators) or by force majeure.</li>
        </ol>

        <h2 style={h2}>VII. No warranty and liability</h2>
        <ol style={ol}>
          <li style={li}>The Service is provided "as is". Check results, the quality score and alerts are auxiliary and informational in nature — they do not guarantee the accuracy or completeness of the User's GA4 data. The User is responsible for verifying their own analytics implementation.</li>
          <li style={li}>To the maximum extent permitted by law, the Operator is not liable for indirect, incidental or consequential damages arising from using or being unable to use the Service, including business decisions made based on check results or alerts received (or not received).</li>
          <li style={li}>The above limitations do not exclude the Operator's liability to the extent it cannot be limited or excluded under mandatory law, in particular toward Users who are consumers.</li>
        </ol>

        <h2 style={h2}>VIII. Entrustment of personal data processing</h2>
        <ol style={ol}>
          <li style={li}>To the extent that, in using the Service, the User provides the Operator with the personal data of third parties (e.g. the email addresses of alert recipients other than the User themself), the User entrusts the Operator with processing that data solely to provide the Service — sending alert notifications to the given address.</li>
          <li style={li}>The User represents that they have a legal basis to provide the Operator with such data, and that it is current and accurate.</li>
          <li style={li}>The Operator processes entrusted data only on the User's documented instructions arising from their use of the Service, applies appropriate technical and organizational measures, and uses the subprocessors listed in the Privacy Policy, informing Users of any material changes to that list.</li>
          <li style={li}>Detailed rules on personal data processing, including categories of data, purposes, legal bases and retention periods, are described in the <Link href="/en/privacy" style={link}>Privacy Policy</Link>.</li>
        </ol>

        <h2 style={h2}>IX. Complaints</h2>
        <ol style={ol}>
          <li style={li}>Complaints about the Service's operation should be sent to <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>, marked "Complaint", stating: the User's identifying details (full name or company name), the email address tied to the Account, and a description and reason for the complaint.</li>
          <li style={li}>The Operator reviews a complaint within 14 days of receiving it and informs the User of the outcome electronically. If a submission needs additional information, this period runs from the day the additional information is received.</li>
          <li style={li}>
            A User who is a consumer may use out-of-court complaint and claim resolution via the{' '}
            <a href="https://ec.europa.eu/consumers/odr" style={link}>European Commission's ODR platform</a>{' '}
            or Poland's Financial Ombudsman / UOKiK, under the rules described at{' '}
            <a href="https://polubowne.uokik.gov.pl/" style={link}>polubowne.uokik.gov.pl</a>.
          </li>
        </ol>

        <h2 style={h2}>X. Ending use of the Service and data export</h2>
        <ol style={ol}>
          <li style={li}>The User may delete a Project at any time from its settings — deletion is immediate and permanent (the Project's configuration and check history are erased).</li>
          <li style={li}>
            The User may revoke AlertGA4's access to their Google account at any time in their{' '}
            <a href="https://myaccount.google.com/permissions" style={link}>Google account settings</a>{' '}
            and cancel their subscription through the payment management portal.
          </li>
          <li style={li}>To request complete deletion of the Account and all associated data, write to <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>. The Operator will delete the data promptly, subject to the period necessary to demonstrate the correctness of billing (e.g. for tax and accounting purposes).</li>
          <li style={li}>The Operator may suspend or end access to an Account that violates chapter IV, with no obligation to refund fees for the unused part of the Billing Period.</li>
        </ol>

        <h2 style={h2}>XI. Intellectual property</h2>
        <p style={p}>
          The Service, its name, logo, graphic elements, source code, and the layout of its content are the exclusive property of the Operator or of entities with which the Operator has entered into appropriate license agreements, and are legally protected. Using the Service does not transfer any intellectual property rights to the User.
        </p>

        <h2 style={h2}>XII. Final provisions</h2>
        <ol style={ol}>
          <li style={li}>The Operator may amend these Terms for a valid reason, in particular a change in the Service's functionality, a change in the law, or an improvement to the quality of service for Users. The Operator will notify Users of changes electronically and by publishing the new Terms on the Service's website with a current date.</li>
          <li style={li}>Continuing to use the Service after changes take effect constitutes acceptance of them. A User who does not accept the changes may stop using the Service before they take effect.</li>
          <li style={li}>Matters not covered by these Terms are governed by Polish law.</li>
          <li style={li}>Any disputes arising from the use of the Service will be resolved by the court with jurisdiction under applicable law; for Users who are not consumers — by the court with jurisdiction over the Operator's registered office.</li>
          <li style={li}>These Terms are available free of charge at alertga4.pl/en/terms.</li>
          <li style={li}>Questions about these Terms: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.</li>
        </ol>

        <p style={{ ...p, marginTop: 24 }}>
          See also our <Link href="/en/privacy" style={link}>Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}
