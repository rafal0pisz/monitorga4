'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  invitedEmail: string
  ownerEmail: string
  alreadyAccepted: boolean
  notFound: boolean
}

export default function AcceptInviteClient({ token, invitedEmail, ownerEmail, alreadyAccepted, notFound }: Props) {
  const [sessionEmail, setSessionEmail] = useState<string | null | undefined>(undefined) // undefined = loading
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? null))
  }, [])

  async function handleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`,
      },
    })
  }

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not accept this invite.')
      setDone(true)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message)
      setAccepting(false)
    }
  }

  if (notFound) {
    return <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>This invite link is invalid or has been revoked.</p>
  }
  if (alreadyAccepted) {
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>This invite has already been accepted.</p>
        <a href="/dashboard" style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Go to dashboard →</a>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
        <b style={{ color: 'var(--color-text-primary)' }}>{ownerEmail}</b> invited you to their AlertGA4 team (<b>{invitedEmail}</b>).
      </p>

      {sessionEmail === undefined ? null : sessionEmail === null ? (
        <button
          type="button" onClick={handleSignIn}
          style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer' }}
        >
          Sign in with Google to accept
        </button>
      ) : sessionEmail.toLowerCase() !== invitedEmail.toLowerCase() ? (
        <div>
          <p style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 10 }}>
            You&apos;re signed in as <b>{sessionEmail}</b>, but this invite was sent to <b>{invitedEmail}</b>. Sign out and sign in with that account to accept it.
          </p>
          <a href="/login" style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Switch account →</a>
        </div>
      ) : (
        <button
          type="button" onClick={handleAccept} disabled={accepting || done}
          style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, cursor: accepting ? 'wait' : 'pointer' }}
        >
          {accepting ? 'Accepting…' : 'Accept invite'}
        </button>
      )}

      {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
