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
  groupIds: string[]
}

export interface TeamGroupOption {
  id: string
  name: string
}

function Avatar({ email }: { email: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
    }}>
      {email.charAt(0)}
    </div>
  )
}

function StatusPill({ accepted }: { accepted: boolean }) {
  return accepted ? (
    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534' }}>Active</span>
  ) : (
    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e' }}>Pending</span>
  )
}

// Group access toggles as filled/outline chips rather than native checkbox
// rows — scans faster at a glance than a checklist, and matches the pill/
// badge language used elsewhere (status chips, coverage labels).
function GroupChip({ name, active, disabled, onClick }: { name: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
        border: active ? '1px solid #16a34a' : '1px solid var(--color-border-tertiary)',
        background: active ? '#16a34a' : 'var(--color-background-primary)',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        opacity: disabled && !active ? 0.5 : 1,
        transition: 'all 0.12s ease',
      }}
    >
      {active && '✓ '}{name}
    </button>
  )
}

export default function TeamManager({
  members, allGroups, maxSeats, perProjectCap, appUrl,
}: {
  members: TeamMemberRow[]
  allGroups: TeamGroupOption[]
  maxSeats: number
  perProjectCap: number
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
  const unlimitedPerGroup = perProjectCap >= maxSeats

  // How many members currently have each group, across everyone — so a
  // chip for someone who DOESN'T already have a group can be disabled
  // once that group is full, without a round trip to find out.
  const countByGroup = new Map<string, number>()
  for (const m of members) for (const gid of m.groupIds) countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1)

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

  async function handleToggleAccess(teamMemberId: string, groupId: string, grant: boolean) {
    const key = `${teamMemberId}_${groupId}`
    setTogglingKey(key)
    setError(null)
    try {
      const res = await fetch('/api/team/group-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId, groupId, grant }),
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
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-background-tertiary)', padding: '3px 10px', borderRadius: 999 }}>{seatsUsed} / {maxSeats} seats</span>
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
          Inviting someone here doesn&apos;t give them access to anything yet. Expand their row below and tap a group to grant it — they&apos;ll see every service in that group, including ones added to it later.
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', flexWrap: 'wrap' }}>
                <Avatar email={m.email} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
                    <StatusPill accepted={!!m.accepted_at} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {!m.accepted_at && (
                      <>
                        <a
                          href="#"
                          onClick={e => { e.preventDefault(); navigator.clipboard?.writeText(`${appUrl}/invite/${m.invite_token}`) }}
                          style={{ color: '#16a34a', textDecoration: 'underline' }}
                        >
                          copy invite link
                        </a>
                        {' · '}
                      </>
                    )}
                    {m.groupIds.length === 0 ? 'No groups yet' : `${m.groupIds.length} ${m.groupIds.length === 1 ? 'group' : 'groups'}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <button
                    type="button" onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 500 }}
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
                <div style={{ padding: '4px 20px 16px 62px', background: 'var(--color-background-tertiary)' }}>
                  {allGroups.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>No groups yet — create one on the Groups page.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {allGroups.map(g => {
                        const key = `${m.id}_${g.id}`
                        const hasAccess = m.groupIds.includes(g.id)
                        const groupFull = !unlimitedPerGroup && !hasAccess && (countByGroup.get(g.id) ?? 0) >= perProjectCap
                        return (
                          <GroupChip
                            key={g.id}
                            name={g.name}
                            active={hasAccess}
                            disabled={togglingKey === key || groupFull}
                            onClick={() => handleToggleAccess(m.id, g.id, !hasAccess)}
                          />
                        )
                      })}
                    </div>
                  )}
                  {!unlimitedPerGroup && <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '10px 0 0' }}>Your plan allows up to {perProjectCap} people per group.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
