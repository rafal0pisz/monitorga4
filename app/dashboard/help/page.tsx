const h2: React.CSSProperties = { fontSize: 15, fontWeight: 500, margin: '28px 0 10px', color: 'var(--color-text-primary)' }
const card: React.CSSProperties = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px', marginBottom: 10 }
const q: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }
const a: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Help</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>How AlertGA4&apos;s score and checks work, and what to do about common issues.</p>
      </div>

      <h2 style={h2}>Understanding your score</h2>
      <div style={card}>
        <p style={a}>
          Each project gets a score from 0–100, computed from a set of daily checks against its GA4 data (expected events, self-referral traffic, bounce rate, direct traffic, conversion rate, missing page titles, bot traffic at night, duplicate purchases, plus anything you&apos;ve configured under Custom events, Ecommerce, or Parameters). Every check is weighted and contributes pass / warn / fail to the total.
        </p>
      </div>
      <div style={card}>
        <p style={a}><b>91–100</b> Excellent · <b>81–90</b> Good · <b>71–80</b> Fair · <b>51–70</b> Warning · <b>0–50</b> Critical</p>
      </div>
      <div style={card}>
        <p style={a}>
          The score shown is always based on data from <b>two days ago</b> — GA4&apos;s own data for &quot;yesterday&quot; isn&apos;t fully settled yet, so the automatic daily check always looks at the last day GA4 has fully processed. &quot;Run now&quot; on a project page checks the same data; it doesn&apos;t pull fresher numbers, it just re-runs the check immediately instead of waiting for tomorrow&apos;s automatic run.
        </p>
      </div>

      <h2 style={h2}>Common issues</h2>

      <div style={card}>
        <p style={q}>A project shows a GA4 connection error or stops updating.</p>
        <p style={a}>
          This almost always means the Google account connected to AlertGA4 needs to sign in again — Google access can expire or get revoked independently of your AlertGA4 session. You&apos;ll also get an email about this automatically. Go to the project page — if this is the cause, you&apos;ll see a &quot;Reconnect with Google&quot; prompt there; otherwise sign out and sign back in with the Google account that has Viewer access to that GA4 property.
        </p>
      </div>

      <div style={card}>
        <p style={q}>I&apos;m not getting email alerts.</p>
        <p style={a}>
          Check that an alert email is set on the project (Settings), and that the project&apos;s score is actually below its alert threshold — alerts only fire when a project crosses below the threshold you&apos;ve set, not on every run. Only one alert email is sent per project per day even if the score stays low for several days in a row.
        </p>
      </div>

      <div style={card}>
        <p style={q}>&quot;Run now&quot; says to wait before running again.</p>
        <p style={a}>
          Manual runs have a short cooldown between clicks on the same project, to avoid burning through that property&apos;s own GA4 API quota. The automatic daily check is unaffected and keeps running on its own schedule regardless.
        </p>
      </div>

      <div style={card}>
        <p style={q}>I&apos;ve reached my plan&apos;s project limit.</p>
        <p style={a}>
          Each plan caps how many GA4 properties you can monitor at once — see <a href="/cennik" style={{ color: '#16a34a' }}>Pricing</a> for current limits, or upgrade from the Billing page. Existing projects keep running normally; the limit only blocks adding new ones.
        </p>
      </div>

      <div style={card}>
        <p style={q}>My trial ended / my plan lapsed.</p>
        <p style={a}>
          Without an active plan, AlertGA4 stops pulling live GA4 data and running daily checks on your projects — your project configuration and history are kept, nothing is deleted. Pick a plan on the Billing page to pick back up where you left off.
        </p>
      </div>

      <h2 style={h2}>Team</h2>
      <div style={card}>
        <p style={a}>
          Agency plan accounts can invite team members from <a href="/dashboard/team" style={{ color: '#16a34a' }}>Team</a> — an invited member sees and can manage the same projects as the account owner, without needing their own Google Viewer access to GA4. Billing, invoices, and account deletion stay with the owner only.
        </p>
      </div>

      <h2 style={h2}>Your data</h2>
      <div style={card}>
        <p style={a}>
          You can export your account, projects, and check history as a JSON file, or permanently delete your account, from <a href="/dashboard/billing" style={{ color: '#16a34a' }}>Billing → Your data</a>.
        </p>
      </div>

      <h2 style={h2}>Still stuck?</h2>
      <div style={card}>
        <p style={a}>
          Write to <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a> — include the project name and, if relevant, a screenshot of what you&apos;re seeing.
        </p>
      </div>
    </div>
  )
}
