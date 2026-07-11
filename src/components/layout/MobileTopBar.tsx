'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import BrandWordmark from '@/components/ui/BrandWordmark'

// Owns the sidebar open/close state on mobile and toggles it onto the
// sidebar/overlay DOM nodes by id — those live in AppSidebar, a server
// component, so this is the only way to drive them from a client-side
// interaction without lifting server-fetched data into a client wrapper.
export default function MobileTopBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const sidebar = document.getElementById('app-sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    if (sidebar) sidebar.classList.toggle('open', open)
    if (overlay) overlay.classList.toggle('open', open)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* NOT nested inside .mobile-topbar — a position:fixed descendant of a
          higher z-index ancestor paints (and hit-tests) as part of that
          ancestor's stacking context, not at its own z-index. Nested here,
          the overlay was rendering above .app-sidebar despite its lower
          z-index, silently swallowing every tap meant for a nav link. */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-topbar-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
        </button>
        <BrandWordmark size={16} mono />
      </div>
      <div id="sidebar-overlay" className="sidebar-overlay" onClick={() => setOpen(false)} />
    </>
  )
}
