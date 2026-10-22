import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/admin/isAdminEmail'

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '18px 20px', flex: '1 1 160px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent ?? 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 12.5 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const REASON_LABELS: Record<string, string> = {
  price: 'Too expensive',
  no_time: "Didn't have time to try it",
  not_needed: "Don't need this tool",
  other: 'Other reason',
}

export default async function AdminMarketingPage() {
  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  if (!authData?.user) redirect('/login')

  if (!isAdminEmail(authData.user.email)) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access denied</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          This page is restricted to the AlertGA4 admin account.
        </p>
      </div>
    )
  }

  const admin = createAdminClient()

  const [{ count: sentCount }, { data: responsesRaw }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).not('trial_winback_sent_at', 'is', null),
    admin.from('trial_winback_responses').select('reason'),
  ])

  const responses = (responsesRaw ?? []) as { reason: string }[]
  const responseCounts: Record<string, number> = {}
  for (const r of responses) responseCounts[r.reason] = (responseCounts[r.reason] ?? 0) + 1
  const responseRate = sentCount ? Math.round((responses.length / sentCount) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>
      <nav style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
          <Link href="/admin/dashboard-app" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Business overview</Link>
          <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Marketing</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Marketing — trial win-back campaign</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
          Internal reference: what's live, the approved terms, and what was proposed but not built. Admin-only.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <StatTile label="Win-back emails sent" value={sentCount ?? 0} />
          <StatTile label="Survey responses" value={responses.length} />
          <StatTile label="Response rate" value={`${responseRate}%`} />
        </div>

        {responses.length > 0 && (
          <Card title="Why people say they didn't convert">
            {Object.entries(REASON_LABELS).map(([key, label]) => (
              <Field key={key} label={label} value={`${responseCounts[key] ?? 0} (${responses.length ? Math.round(((responseCounts[key] ?? 0) / responses.length) * 100) : 0}%)`} />
            ))}
          </Card>
        )}

        <Card title="Status">
          <p style={{ fontSize: 12.5, color: 'var(--color-text-primary)', margin: 0 }}>
            🟢 Live since 22 Oct 2026. Runs automatically — no manual steps required.
          </p>
        </Card>

        <Card title="What it does">
          <ol style={{ fontSize: 12.5, color: 'var(--color-text-primary)', lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>A daily cron checks for trial accounts whose trial ended 2–3 days ago and that haven't been emailed yet.</li>
            <li>Each eligible account gets <b>one</b> email, ever, containing:
              <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
                <li>A recap of their last completed GA4 check (score + date) — skipped if their trial ended before any check ever ran.</li>
                <li>A one-time 30%-off discount code, locked to their own Stripe customer account (can't be shared or reused by anyone else).</li>
                <li>A one-click, 4-option survey asking why they didn't convert.</li>
              </ul>
            </li>
            <li>Survey answers are logged for this page's breakdown above — no further action is taken automatically on them.</li>
          </ol>
        </Card>

        <Card title="Approved terms">
          <Field label="Trigger timing" value="2 days after trial_ends_at" />
          <Field label="Discount" value="30% off the first invoice (month or year)" />
          <Field label="Code validity" value="14 days from send, per recipient" />
          <Field label="Redemption limit" value="1 use, locked to the recipient's Stripe customer" />
          <Field label="Repeat sends" value="Never — one email per account, tracked via profiles.trial_winback_sent_at" />
          <Field label="Historical backlog" value="Excluded by design — only trials expiring from 22 Oct 2026 onward are eligible" />
        </Card>

        <Card title="Where it lives in the codebase">
          <Field label="Cron / email trigger" value="app/api/worker/trial-winback/route.ts" />
          <Field label="Email template" value="src/lib/email/trialWinback.ts" />
          <Field label="Stripe coupon / promo code logic" value="src/lib/billing/winback.ts" />
          <Field label="Survey endpoint" value="app/api/trial-winback/survey/route.ts" />
          <Field label="Survey thank-you page" value="app/trial-winback/thanks/page.tsx" />
          <Field label="Cron schedule" value="vercel.json — 0 9 * * * (UTC)" />
          <Field label="Migration" value="supabase/migrations/030_trial_winback.sql" />
        </Card>

        <Card title="Proposed, not built yet">
          <ul style={{ fontSize: 12.5, color: 'var(--color-text-primary)', lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
            <li><b>Manual outreach for high-value leads</b> — company-domain signups (e.g. k2.pl, sanofi.com) vs. personal Gmail addresses, for a personal follow-up instead of an automated email.</li>
            <li><b>CSV export → newsletter/nurture list</b> — the Registered users export on the Business overview page already has everything needed to build this list manually.</li>
            <li><b>Trial extension for "engaged but unconverted"</b> accounts — people who actually used the product during their trial but didn't buy, as an alternative to a discount.</li>
          </ul>
          <p style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 10 }}>
            See the Registered users table on the <Link href="/admin/dashboard-app" style={{ color: '#1e3a8a' }}>Business overview</Link> page (filter by Type = "Trial (expired)") to build any of these lists today.
          </p>
        </Card>
      </div>
    </div>
  )
}
