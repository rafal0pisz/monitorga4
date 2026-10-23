'use client'

import { useState } from 'react'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

export default function LeaveTeamButton() {
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useTrackedError('team_leave_button')

  async function handleLeave() {
    setLeaving(true)
    setError(null)
    try {
      const res = await fetch('/api/team/leave', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not leave the team.')
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message)
      setLeaving(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button" onClick={() => setConfirming(true)}
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 12.5, color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Leave this team
      </button>
    )
  }

  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
        You&apos;ll lose access to this team&apos;s projects immediately. Any projects or plan of your own are unaffected.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button" onClick={handleLeave} disabled={leaving}
          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 500, cursor: leaving ? 'wait' : 'pointer' }}
        >
          {leaving ? 'Leaving…' : 'Confirm — leave team'}
        </button>
        <button
          type="button" onClick={() => setConfirming(false)}
          style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{error}</p>}
    </div>
  )
}
