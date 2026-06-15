'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
const PERIODS = [{ days: 7, label: '7d' }, { days: 14, label: '14d' }, { days: 30, label: '30d' }]
export default function PeriodSelector({ current }: { current: number }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams()
  function setPeriod(days: number) { const p = new URLSearchParams(searchParams.toString()); p.set('period', String(days)); router.push(`${pathname}?${p.toString()}`) }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Period:</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {PERIODS.map(p => (
          <button key={p.days} onClick={() => setPeriod(p.days)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${current === p.days ? '#bbf7d0' : 'var(--color-border-tertiary)'}`, background: current === p.days ? '#f0fdf4' : 'var(--color-background-secondary)', color: current === p.days ? '#16a34a' : 'var(--color-text-secondary)', fontWeight: current === p.days ? 500 : 400 }}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
