'use client'

import { useRef, useState } from 'react'
import { ROWS, PLAN_KEYS, PLAN_LABELS } from './PlanComparisonTable'
import { PLANS } from '@/lib/billing/plans'

const SWIPE_THRESHOLD = 40

export default function PlanComparisonCarousel() {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const planKey = PLAN_KEYS[index]
  const plan = PLANS.find(p => p.id === planKey)

  function go(next: number) {
    setIndex(Math.max(0, Math.min(PLAN_KEYS.length - 1, next)))
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > SWIPE_THRESHOLD) go(index - 1)
    else if (delta < -SWIPE_THRESHOLD) go(index + 1)
    touchStartX.current = null
  }

  return (
    <div>
      <div
        className="plan-carousel-swipe"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button type="button" className="plan-carousel-arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Poprzedni plan">‹</button>

        <div className="plan-carousel-card">
          <div className="plan-carousel-head">
            <span className="name">{PLAN_LABELS[planKey]}</span>
            {plan && <span className="price">{plan.priceMonthlyPLN} zł/mies.</span>}
          </div>
          {ROWS.map(row => (
            <div key={row.label} className="plan-carousel-row">
              <span className="k">{row.label}</span>
              <span className={`v${row[planKey] === '✓' ? ' check' : ''}${row[planKey] === '—' ? ' dash' : ''}`}>{row[planKey]}</span>
            </div>
          ))}
        </div>

        <button type="button" className="plan-carousel-arrow" onClick={() => go(index + 1)} disabled={index === PLAN_KEYS.length - 1} aria-label="Następny plan">›</button>
      </div>

      <div className="plan-carousel-dots">
        {PLAN_KEYS.map((key, i) => (
          <button
            key={key}
            type="button"
            className={`plan-carousel-dot${i === index ? ' active' : ''}`}
            onClick={() => go(i)}
            aria-label={`Pokaż plan ${PLAN_LABELS[key]}`}
          />
        ))}
      </div>
    </div>
  )
}
