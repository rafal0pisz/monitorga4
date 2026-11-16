'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

export interface TeamMemberRow {
  id: string
  email: string
  accepted_at: string | null
  invited_at: string
  invite_token: string
  projectIds: string[]
}

export interface TeamProjectOption {
  id: string
  name: string
}

export default function TeamManager({
  members, allProjects, maxSeats, appUrl,
}: {
  members: TeamMemberRow[]
  allProjects: TeamProjectOption[]
  maxSeats: number
  appUrl: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useTrackedError('team_manager')
  const [notice, setNotice] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

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

  async function handleToggleAccess(teamMemberId: string, projectId: string, grant: boolean) {
    const key = `${teamMemberId}_${projectId}`
    setTogglingKey(key)
    setError(null)
    try {
      const res = await fetch('/api/team/project-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId, projectId, grant }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not update access.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingKey(null)
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
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '12px 0 0', lineHeight: 1.5 }}>
          Inviting someone here doesn&apos;t give them access to anything yet. To give someone access to a service: expand their row below and turn it on for the services they should see, or open that service&apos;s Settings page and add them there directly.
        </p>
        {notice && <p style={{ fontSize: 12.5, color: '#92400e', marginTop: 10 }}>{notice}</p>}
        {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 10 }}>{error}</p>}
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '20px 24px', margin: 0 }}>No team members yet — invite someone above.</p>
        ) : members.map((m, i) => {
          const isExpanded = expandedId === m.id
          return (
            <div key={m.id} style={{ borderBottom: i < members.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 20px', flexWrap: 'wrap' }}>
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
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                    {m.projectIds.length === 0 ? 'No services yet' : `${m.projectIds.length} ${m.projectIds.length === 1 ? 'service' : 'services'}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <button
                    type="button" onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#7c3aed', cursor: 'pointer' }}
                  >
                    {isExpanded ? 'Hide access ▴' : 'Manage access ▾'}
                  </button>
                  <button
                    type="button" onClick={() => handleRemove(m.id)} disabled={removingId === m.id}
                    style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {removingId === m.id ? 'Removing…' : m.accepted_at ? 'Remove' : 'Revoke'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '4px 20px 16px', background: 'var(--color-background-tertiary)' }}>
                  {allProjects.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>You don&apos;t have any services yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {allProjects.map(p => {
                        const key = `${m.id}_${p.id}`
                        const hasAccess = m.projectIds.includes(p.id)
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-primary)', cursor: togglingKey === key ? 'wait' : 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              disabled={togglingKey === key}
                              onChange={e => handleToggleAccess(m.id, p.id, e.target.checked)}
                            />
                            {p.name}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
