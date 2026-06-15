'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleGoogleLogin() {
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback`, scopes: 'https://www.googleapis.com/auth/analytics.readonly', queryParams: { access_type: 'offline', prompt: 'consent' } } })
    if (error) { setError(error.message); setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>GA4 <span style={{ color: '#16a34a' }}>Quality Score</span></p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>monitor.bettersteps.pl</p>
        </div>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '28px 28px' }}>
          <h1 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>Use a Google account with access to Google Analytics</p>
          {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{error}</div>}
          <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: loading ? '#f9fafb' : '#fff', color: '#374151', fontWeight: 500, fontSize: 14, border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: '10px 16px', cursor: loading ? 'wait' : 'pointer' }}>
            {!loading && <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>}
            {loading ? 'Redirecting...' : 'Sign in with Google'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 16 }}>Required scope: Google Analytics (read-only)</p>
        </div>
      </div>
    </div>
  )
}
