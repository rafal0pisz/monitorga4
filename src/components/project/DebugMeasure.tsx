'use client'

// TEMPORARY — diagnosing a mobile width report that doesn't reproduce in
// local testing. Remove once resolved.
import { useEffect, useState } from 'react'

export default function DebugMeasure() {
  const [info, setInfo] = useState('measuring…')

  useEffect(() => {
    function measure() {
      const vw = window.innerWidth
      const dpr = window.devicePixelRatio
      const parts = [`vw=${vw}`, `dpr=${dpr}`]
      const selectors: [string, string][] = [
        ['.app-main', 'main'],
        ['.page-content-wrap', 'wrap'],
        ['.page-score-header', 'score'],
        ['.page-nav-row', 'nav'],
      ]
      for (const [sel, label] of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          parts.push(`${label}:w${Math.round(r.width)}@l${Math.round(r.left)} pad(${cs.paddingLeft}/${cs.paddingRight})`)
        } else {
          parts.push(`${label}:MISSING`)
        }
      }
      setInfo(parts.join(' | '))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
      background: '#000', color: '#22c55e', fontSize: 9, lineHeight: 1.4,
      fontFamily: 'monospace', padding: '4px 6px', wordBreak: 'break-all',
    }}>
      DEBUG {info}
    </div>
  )
}
