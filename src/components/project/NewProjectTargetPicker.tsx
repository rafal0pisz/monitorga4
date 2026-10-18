'use client'

import { useState } from 'react'
import NewProjectForm from './NewProjectForm'

interface Target { label: string }
interface TeamTarget extends Target { ownerId: string }

export default function NewProjectTargetPicker({ ownTarget, teamTarget }: { ownTarget: Target; teamTarget: TeamTarget }) {
  const [choice, setChoice] = useState<'own' | 'team'>('own')

  const optionStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, textAlign: 'center', padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    border: `1px solid ${active ? '#16a34a' : 'var(--color-border-tertiary)'}`,
    background: active ? '#f0fdf4' : 'var(--color-background-primary)',
    color: active ? '#16a34a' : 'var(--color-text-primary)',
  })

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Add this project to</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={optionStyle(choice === 'own')} onClick={() => setChoice('own')}>{ownTarget.label}</div>
        <div style={optionStyle(choice === 'team')} onClick={() => setChoice('team')}>{teamTarget.label}</div>
      </div>

      {choice === 'team' && (
        <div style={{ fontSize: 12.5, color: '#92400e', background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          This project will be added to {teamTarget.label}&apos;s account, not yours. Daily automated checks run on the team owner&apos;s Google access — if only your Google account has Viewer access to this GA4 property, make sure they get it too, or checks will fail.
        </div>
      )}

      <NewProjectForm key={choice} ownerId={choice === 'team' ? teamTarget.ownerId : undefined} />
    </div>
  )
}
