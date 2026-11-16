'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

export interface GroupRow {
  id: string
  name: string
  projectIds: string[]
  memberIds: string[]
}

export interface GroupProjectOption {
  id: string
  name: string
  groupId: string | null
}

export interface GroupMemberOption {
  id: string
  email: string
  accepted: boolean
}

function GroupIcon() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
      background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
    }}>
      ▣
    </div>
  )
}

function MemberChip({ email, active, disabled, onClick }: { email: string; active: boolean; disabled: boolean; onClick: () => void }) {
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
      {active && '✓ '}{email}
    </button>
  )
}

export default function GroupManager({
  groups, allProjects, allMembers, perProjectCap,
}: {
  groups: GroupRow[]
  allProjects: GroupProjectOption[]
  allMembers: GroupMemberOption[]
  perProjectCap: number
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useTrackedError('group_manager')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState('')

  const unlimited = perProjectCap >= Number.MAX_SAFE_INTEGER
  const nameById = new Map(groups.map(g => [g.id, g.name]))

  async function handleCreate() {
    setError(null)
    if (!name.trim()) { setError('Enter a name'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/team/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not create the group.')
      setName('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(groupId: string) {
    setDeletingId(groupId)
    setError(null)
    try {
      const res = await fetch('/api/team/groups', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not delete the group.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleMember(groupId: string, teamMemberId: string, grant: boolean) {
    const key = `m_${groupId}_${teamMemberId}`
    setBusyKey(key)
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
      setBusyKey(null)
    }
  }

  async function handleToggleProject(groupId: string, projectId: string, add: boolean) {
    const key = `p_${groupId}_${projectId}`
    setBusyKey(key)
    setError(null)
    try {
      const res = await fetch('/api/team/group-projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, groupId, add }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not update the group.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>Create a group</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bettersteps"
            style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)' }}
          />
          <button
            type="button" onClick={handleCreate} disabled={creating}
            style={{ background: '#16a34a', color: '#fff', fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, cursor: creating ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {creating ? 'Creating…' : 'Create group'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Saved as &quot;GROUP - {name.trim() || '…'}&quot;. Grant a group access once and every service you put in it — now or later — is covered automatically.
        </p>
        {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 10 }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.length === 0 ? (
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No groups yet — create one above, e.g. one per client.</p>
          </div>
        ) : groups.map(g => {
          const isExpanded = expandedId === g.id
          const filteredProjects = projectFilter.trim()
            ? allProjects.filter(p => p.name.toLowerCase().includes(projectFilter.trim().toLowerCase()))
            : allProjects
          return (
            <div key={g.id} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
                <GroupIcon />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{g.name}</p>
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                    {g.projectIds.length} {g.projectIds.length === 1 ? 'service' : 'services'} · {g.memberIds.length} {g.memberIds.length === 1 ? 'person' : 'people'} with access
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <button
                    type="button" onClick={() => setExpandedId(isExpanded ? null : g.id)}
                    style={{ background: isExpanded ? '#f3f0ff' : 'var(--color-background-tertiary)', border: 'none', fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', padding: '6px 14px', borderRadius: 999 }}
                  >
                    {isExpanded ? 'Hide ▴' : 'Manage ▾'}
                  </button>
                  <button
                    type="button" onClick={() => handleDelete(g.id)} disabled={deletingId === g.id}
                    style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {deletingId === g.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '4px 20px 20px', background: 'var(--color-background-tertiary)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3, margin: '10px 0 8px' }}>
                      Team access {!unlimited && `(up to ${perProjectCap} people)`}
                    </p>
                    {allMembers.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>No team members yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {allMembers.map(m => {
                          const key = `m_${g.id}_${m.id}`
                          const hasAccess = g.memberIds.includes(m.id)
                          const full = !unlimited && !hasAccess && g.memberIds.length >= perProjectCap
                          return (
                            <MemberChip
                              key={m.id}
                              email={m.accepted ? m.email : `${m.email} (pending)`}
                              active={hasAccess}
                              disabled={busyKey === key || full}
                              onClick={() => handleToggleMember(g.id, m.id, !hasAccess)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 0 8px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3, margin: 0 }}>Services in this group</p>
                      {allProjects.length > 8 && (
                        <input
                          type="text" value={projectFilter} onChange={e => setProjectFilter(e.target.value)} placeholder="Filter services…"
                          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', width: 180 }}
                        />
                      )}
                    </div>
                    {allProjects.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>You don&apos;t have any services yet.</p>
                    ) : filteredProjects.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>No services match &quot;{projectFilter}&quot;.</p>
                    ) : (
                      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, maxHeight: 280, overflowY: 'auto' }}>
                        {filteredProjects.map((p, i) => {
                          const key = `p_${g.id}_${p.id}`
                          const inThisGroup = p.groupId === g.id
                          const inOtherGroup = p.groupId && p.groupId !== g.id
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', fontSize: 12.5, color: 'var(--color-text-primary)',
                                cursor: busyKey === key ? 'wait' : 'pointer',
                                borderBottom: i < filteredProjects.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                              }}
                            >
                              <input
                                type="checkbox" checked={inThisGroup} disabled={busyKey === key}
                                onChange={e => handleToggleProject(g.id, p.id, e.target.checked)}
                              />
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                              {inOtherGroup && (
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  in {nameById.get(p.groupId!) ?? 'another group'}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
