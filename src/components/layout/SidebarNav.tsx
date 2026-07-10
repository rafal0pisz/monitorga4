'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { scoreColor } from '@/types'

interface Project {
  id: string
  name: string
  last_score: number | null
  status: string
}

function scoreDotColor(score: number | null): string {
  return score === null ? '#d1d5db' : scoreColor(score)
}

export default function SidebarNav({ projects }: { projects: Project[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile navigation)
  useEffect(() => { setOpen(false) }, [pathname])

  // Sync open state to DOM (CSS classes on the aside element)
  useEffect(() => {
    const sidebar  = document.getElementById('app-sidebar')
    const overlay  = document.getElementById('sidebar-overlay')
    const hamburger = document.getElementById('sidebar-hamburger')
    if (sidebar)   sidebar.classList.toggle('open', open)
    if (overlay)   overlay.classList.toggle('open', open)
    if (hamburger) hamburger.setAttribute('aria-expanded', String(open))
    // Prevent body scroll when open on mobile
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Hamburger button — visible on mobile only via CSS */}
      <button
        id="sidebar-hamburger"
        className="sidebar-hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <span style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
        <span style={{ opacity: open ? 0 : 1 }} />
        <span style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
      </button>

      {/* Overlay backdrop — mobile only */}
      <div
        id="sidebar-overlay"
        className="sidebar-overlay"
        onClick={() => setOpen(false)}
      />

      {/* Nav content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Mobile close button inside sidebar */}
        <div style={{ display: 'none' }} className="sidebar-close-row">
          <button
            onClick={() => setOpen(false)}
            style={{ margin: '8px 16px 0 auto', display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-secondary)', padding: 4 }}
            aria-label="Close menu"
          >✕</button>
        </div>

        {/* Projects */}
        <div style={{ padding: '14px 0 8px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', padding: '0 16px', margin: '0 0 4px' }}>
            Projects
          </p>
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {projects.map(p => {
              const active = isActive(`/project/${p.id}`)
              return (
                <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px',
                    borderLeft: active ? '2px solid #16a34a' : '2px solid transparent',
                    background: active ? 'var(--color-background-primary)' : 'transparent',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: scoreDotColor(p.last_score) }} />
                    <span style={{
                      fontSize: 13,
                      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: active ? 500 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {p.name}
                    </span>
                    {p.last_score !== null && (
                      <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 'auto', flexShrink: 0, color: scoreDotColor(p.last_score) }}>
                        {Math.round(p.last_score)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
            {projects.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '6px 16px', margin: 0 }}>
                No projects yet
              </p>
            )}
          </div>
        </div>

        <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '4px 16px' }} />

        {/* Tools */}
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', padding: '0 16px', margin: '0 0 4px' }}>
            Tools
          </p>
          {[
            { href: '/dashboard/new',     icon: '＋', label: 'New project' },
            { href: '/dashboard',         icon: '⊞', label: 'All projects' },
            { href: '/dashboard/billing', icon: '◈', label: 'Billing' },
          ].map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px',
                  borderLeft: active ? '2px solid #16a34a' : '2px solid transparent',
                  background: active ? 'var(--color-background-primary)' : 'transparent',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', width: 7, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: active ? 500 : 400 }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-row { display: block !important; }
        }
      `}</style>
    </>
  )
}
