import Link from 'next/link'

// Shown instead of a 404 when a signed-in user opens a project that
// belongs to a different Google account — a 404 would be correct for
// "doesn't exist", but here the more useful message is "wrong account".
export default function AccountMismatch() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-tertiary)' }}>
      <div style={{ maxWidth: 380, textAlign: 'center', padding: '32px 24px', backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
          This project isn't linked to your account
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          You're signed in, but this project belongs to a different Google account. If you expected to see it, sign out and sign back in with the correct account.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
            Back to dashboard
          </Link>
          <Link href="/login" style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, backgroundColor: '#16a34a', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  )
}
