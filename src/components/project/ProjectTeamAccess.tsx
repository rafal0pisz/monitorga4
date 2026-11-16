'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

export interface ProjectTeamMemberRow {
  team_member_id: string
  email: string
  accepted: boolean
  has_access: boolean
}

// Lets the project OWNER see and toggle, right from this one service's
// Settings page, which of their team members can see it — the natural
// place to grant access when you're already looking at the service in
// question, alongside the account-wide view on the Team page
// (src/components/team/TeamManager.tsx).
export default function ProjectTeamAccess({ projectId, members, perProjectCap }: { projectId: string; members: ProjectTeamMemberRow[]; perProjectCap: number }) {
  const router = useRouter()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useTrackedError('project_team_access')

  async function handleToggle(teamMemberId: string, grant: boolean) {
    setTogglingId(teamMemberId)
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
      setTogglingId(null)
    }
  }

  async function handleInviteNew() {
    setError(null)
    if (!email.trim()) { setError('Enter an email address'); return }
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), projectId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not send the invite.')
      setEmail('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const unlimited = perProjectCap >= Number.MAX_SAFE_INTEGER
  const accessCount = members.filter(m => m.has_access).length
  const atCap = !unlimited && accessCount >= perProjectCap

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>Team access</p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
        Only the people checked below can see this service — nobody else on your team sees it just by being on your team.
        {!unlimited && ` Your plan allows up to ${perProjectCap} people per service (${accessCount}/${perProjectCap} used here).`}
      </p>

      {members.length === 0 ? (
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
          No team members yet — add one on the <a href="/dashboard/team" style={{ color: '#16a34a' }}>Team page</a>, or invite someone directly to this service below.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {members.map(m => {
            const disableUnchecked = !m.has_access && atCap
            return (
              <label
                key={m.team_member_id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: disableUnchecked ? '#9ca3af' : '#111827', cursor: togglingId === m.team_member_id || disableUnchecked ? 'not-allowed' : 'pointer' }}
                title={disableUnchecked ? `This service already has ${perProjectCap} people — the most your plan allows` : undefined}
              >
                <input
                  type="checkbox"
                  checked={m.has_access}
                  disabled={togglingId === m.team_member_id || disableUnchecked}
                  onChange={e => handleToggle(m.team_member_id, e.target.checked)}
                />
                {m.email} {!m.accepted && <span style={{ color: '#6b7280' }}>(pending)</span>}
              </label>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Invite someone new to this service"
          disabled={atCap}
          style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <button
          type="button" onClick={handleInviteNew} disabled={inviting || atCap}
          style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 13, cursor: (inviting || atCap) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {inviting ? 'Sending…' : 'Invite'}
        </button>
      </div>
      {atCap && <p style={{ fontSize: 12, color: '#92400e', margin: '8px 0 0' }}>This service already has the maximum {perProjectCap} people your plan allows.</p>}
      {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}
