'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Step {
  label: string
  done: boolean
  href?: string
}

export default function OnboardingChecklist({ steps }: { steps: Step[] }) {
  const router = useRouter()
  const [dismissing, setDismissing] = useState(false)

  async function handleDismiss() {
    setDismissing(true)
    try {
      await fetch('/api/onboarding/dismiss', { method: 'POST' })
    } finally {
      router.refresh()
    }
  }

  const doneCount = steps.filter(s => s.done).length

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Get set up</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{doneCount} / {steps.length}</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }}
        >
          Skip setup
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(step => {
          const row = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: step.done ? '#16a34a' : 'var(--color-background-secondary)',
                color: step.done ? '#fff' : 'var(--color-text-secondary)',
                border: step.done ? 'none' : '1px solid var(--color-border-tertiary)',
              }}>
                {step.done ? '✓' : ''}
              </span>
              <span style={{ color: step.done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.label}
              </span>
            </div>
          )
          return step.href && !step.done ? (
            <Link key={step.label} href={step.href} style={{ textDecoration: 'none' }}>{row}</Link>
          ) : (
            <div key={step.label}>{row}</div>
          )
        })}
      </div>
    </div>
  )
}
