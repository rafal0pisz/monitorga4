'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Item { href: string; label: string }

// The pill row silently overflows on desktop, where — unlike mobile — a
// horizontal swipe isn't an obvious gesture, so nothing signals there are
// more categories off to the side. Arrows fade in only on the edge that
// actually has more content, and double as click-to-scroll controls.
export default function FeatureSubnav({ items }: { items: Item[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    window.addEventListener('resize', updateArrows)
    const ro = el ? new ResizeObserver(updateArrows) : null
    if (el && ro) ro.observe(el)
    return () => {
      window.removeEventListener('resize', updateArrows)
      ro?.disconnect()
    }
  }, [updateArrows])

  function scrollByDir(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <div className={`fx-subnav-wrap ${canScrollLeft ? 'can-left' : ''} ${canScrollRight ? 'can-right' : ''}`}>
      {canScrollLeft && (
        <button type="button" className="fx-subnav-arrow fx-subnav-arrow--left" onClick={() => scrollByDir(-1)} aria-label="Przewiń kategorie w lewo">‹</button>
      )}
      <div className="fx-subnav-row" ref={scrollerRef} onScroll={updateArrows}>
        {items.map(s => <a key={s.href} href={s.href}>{s.label}</a>)}
      </div>
      {canScrollRight && (
        <button type="button" className="fx-subnav-arrow fx-subnav-arrow--right" onClick={() => scrollByDir(1)} aria-label="Przewiń kategorie w prawo">›</button>
      )}
    </div>
  )
}
