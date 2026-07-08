'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background-tertiary)',
    }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>QS</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
            AlertGA4
          </h1>
          <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)' }}>
            GA4 implementation quality monitor
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: 14,
          padding: '24px 24px 20px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
            Sign in
          </p>
          <p style={{ fontSize: 12, margin: '0 0 20px', color: 'var(--color-text-secondary)' }}>
            Google account with GA4 Viewer access required.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: '1px solid var(--color-border-tertiary)',
              backgroundColor: loading ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            {/* Google G logo */}
            <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p style={{ fontSize: 11, textAlign: 'center', margin: '14px 0 0', color: 'var(--color-text-secondary)' }}>
            Read-only access to Google Analytics
          </p>
        </div>

        <p style={{ fontSize: 11, textAlign: 'center', margin: '16px 0 0', color: '#6b7280' }}>
          <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</a>
          <span style={{ margin: '0 6px' }}>·</span>
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Service</a>
        </p>
        <p style={{ fontSize: 11, textAlign: 'center', margin: '8px 0 0', color: '#6b7280' }}>
          bettersteps.pl · 2026
        </p>
      </div>
    </div>
  )
}
