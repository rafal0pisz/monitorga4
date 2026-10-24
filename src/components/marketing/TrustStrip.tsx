'use client'

import { useEffect, useRef, useState } from 'react'

// Wariant A from the pricing-page design session: one long row of pills,
// scrollable on desktop (the arrow only shows while there's more to the
// right), stacked and centered on narrow screens via CSS alone (see
// .lp-trust-strip-track's mobile breakpoint in landingStyles.ts) — no JS
// branching needed for that half. Shared between /cennik (below the plan
// comparison table) and the homepage (below "Jak to działa") so the two
// can't silently drift on wording.
const ITEMS = [
  {
    title: 'Dostęp tylko do odczytu',
    sub: 'Read-only access Google',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Dane na serwerach w UE',
    sub: 'Baza danych (Supabase) w regionie europejskim',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    title: 'Zgodność z RODO',
    sub: 'Przetwarzanie danych zgodne z GDPR',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5v6c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Zweryfikowani przez Google',
    sub: 'Zgodność z Google API Services User Data Policy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 12 3 3 5-6" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
]

export default function TrustStrip() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [showArrow, setShowArrow] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    function update() {
      if (!track) return
      const hasOverflow = track.scrollWidth > track.clientWidth + 2
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
      setShowArrow(hasOverflow && !atEnd)
    }
    update()
    track.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  function scrollRight() {
    trackRef.current?.scrollBy({ left: Math.round(trackRef.current.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="lp-trust-strip">
      <div className="wrap">
        <div className="lp-trust-strip-inner">
          <div className="lp-trust-strip-track" ref={trackRef}>
            {ITEMS.map(item => (
              <div className="lp-trust-chip" key={item.title}>
                {item.icon}
                <span>
                  <span className="t">{item.title}</span>
                  <span className="s">{item.sub}</span>
                </span>
              </div>
            ))}
          </div>
          <div className={`lp-trust-strip-fade${showArrow ? '' : ' is-hidden'}`} />
          <button
            type="button"
            className={`lp-trust-strip-arrow${showArrow ? '' : ' is-hidden'}`}
            aria-label="Przewiń w prawo"
            onClick={scrollRight}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
