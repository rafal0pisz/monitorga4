'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const PERIODS = [
  { days: 1,  label: '1d'  },
  { days: 7,  label: '7d'  },
  { days: 14, label: '14d' },
  { days: 30, label: '30d' },
]

const LABELS: Record<number, string> = {
  1:  'Yesterday vs same day last week',
  7:  'Last 7 days vs prev 7 days',
  14: 'Last 14 days vs prev 14 days',
  30: 'Last 30 days vs prev 30 days',
}

export default function PeriodSelector({ current }: { current: number }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function setPeriod(days: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', String(days))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#6B7280' }}>Period:</span>

      <div style={{ display: 'flex', gap: 3 }}>
        {PERIODS.map(p => {
          const active = current === p.days
          return (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              title={LABELS[p.days]}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                border: `1px solid ${active ? '#4ade80' : '#2e3940'}`,
                background: active ? '#14532d' : 'transparent',
                color: active ? '#4ade80' : '#6B7280',
                fontWeight: active ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <span style={{ fontSize: 10, color: '#4B5563', marginLeft: 4 }}>
        {LABELS[current] ?? ''}
      </span>
    </div>
  )
}
