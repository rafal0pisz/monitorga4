import Link from 'next/link'

// Shown to a team member who can see this project exists (shared via
// AlertGA4's own team feature) but hasn't been separately granted Google
// Analytics access to its property — team membership and GA4 access are
// deliberately two different things (see src/lib/ga4/memberAccess.ts).
export default function NoGa4Access({ projectId, memberEmail }: { projectId: string; memberEmail?: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: '32px 24px', backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
          No Google Analytics access yet
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          You&apos;re on the team for this project, but its data isn&apos;t visible to you yet — the owner needs to add
          {memberEmail ? <> <b style={{ color: 'var(--color-text-primary)' }}>{memberEmail}</b></> : ' your Google account'} as a Viewer on this property directly in Google Analytics (Admin → Property access management).
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
            Back to dashboard
          </Link>
          <Link href={`/project/${projectId}/config`} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, backgroundColor: '#16a34a', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            Go to settings
          </Link>
        </div>
      </div>
    </div>
  )
}
