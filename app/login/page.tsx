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
          access_type: 'offline',  // ← KLUCZOWE: Google wyda refresh_token
          prompt: 'consent',       // ← KLUCZOWE: wymusza re-issue refresh_token nawet dla istniejących kont
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // setLoading(false) nie jest potrzebne — nastąpi redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161B22]">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold tracking-tight">
            GA4 <span style={{ color: '#84cc16' }}>Quality Score</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>monitor.bettersteps.pl</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#1D2328', border: '1px solid #2e3940' }}
        >
          <h2 className="text-sm font-semibold mb-1">Sign in</h2>
          <p className="text-xs mb-5" style={{ color: '#6B7280' }}>
            Google account with GA4 Viewer access required.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg py-2.5 px-4
                       font-medium text-sm transition-colors disabled:opacity-60"
            style={{
              backgroundColor: '#fff',
              color: '#1D2328',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span>Redirecting...</span>
            ) : (
              <>
                {/* Google G logo */}
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: '#4B5563' }}>
            Read-only access to Google Analytics
          </p>
        </div>
      </div>
    </div>
  )
}
