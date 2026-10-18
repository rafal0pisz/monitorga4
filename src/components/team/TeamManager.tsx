'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface TeamMemberRow {
  id: string
  email: string
  accepted_at: string | null
  invited_at: string
  invite_token: string
}

export default function TeamManager({ members, maxSeats, appUrl }: { members: TeamMemberRow[]; maxSeats: number; appUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const seatsUsed = 1 + members.length
  const atLimit = seatsUsed >= maxSeats

  async function handleInvite() {
    setError(null); setNotice(null)
    if (!email.trim()) { setError('Enter an email address'); return }
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not send the invite.')
      setEmail('')
      if (data.warning) setNotice(data.warning)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    setError(null)
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not remove.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Invite a team member</p>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{seatsUsed} / {maxSeats} seats used</span>
        </div>
        {atLimit ? (
          <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: 0 }}>You&apos;ve used all {maxSeats} seats included in your plan. Remove someone to invite a new person.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com"
              style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)' }}
            />
            <button
              type="button" onClick={handleInvite} disabled={inviting}
              style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, cursor: inviting ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {inviting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        )}
        {notice && <p style={{ fontSize: 12.5, color: '#92400e', marginTop: 10 }}>{notice}</p>}
        {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 10 }}>{error}</p>}
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '20px 24px', margin: 0 }}>No team members yet — invite someone above.</p>
        ) : members.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 20px', borderBottom: i < members.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
              {m.accepted_at ? (
                <span style={{ fontSize: 11, color: '#16a34a' }}>Active</span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Pending —{' '}
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); navigator.clipboard?.writeText(`${appUrl}/invite/${m.invite_token}`) }}
                    style={{ color: '#16a34a', textDecoration: 'underline' }}
                  >
                    copy invite link
                  </a>
                </span>
              )}
            </div>
            <button
              type="button" onClick={() => handleRemove(m.id)} disabled={removingId === m.id}
              style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
            >
              {removingId === m.id ? 'Removing…' : m.accepted_at ? 'Remove' : 'Revoke'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
