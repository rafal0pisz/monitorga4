import Link from 'next/link'
import SidebarNav from '@/components/layout/SidebarNav'
import MobileTopBar from '@/components/layout/MobileTopBar'
import BrandWordmark from '@/components/ui/BrandWordmark'
import { DEMO_PROJECTS } from '@/lib/demo/data'

const MOBILE_TOPBAR_HEIGHT = 52
const TOPBAR_SAFE_HEIGHT = `calc(${MOBILE_TOPBAR_HEIGHT}px + env(safe-area-inset-top, 0px))`

// Static, no-auth twin of AppSidebar (src/components/layout/AppSidebar.tsx)
// — same markup/CSS so the demo dashboard is visually indistinguishable
// from the real app, but fed DEMO_PROJECTS instead of a Supabase query, and
// swapping the Plan card / Sign out for a "Demo mode" badge and a sign-up
// nudge. Kept as its own component (not a prop-driven variant of
// AppSidebar) since AppSidebar is an async server component wired directly
// to auth + billing lookups that don't apply here.
export default function DemoSidebar() {
  const projects = DEMO_PROJECTS.map(p => ({ id: p.id, name: p.name, last_score: p.last_score, status: p.status }))

  return (
    <>
      <style>{`
        .app-sidebar {
          width: 220px;
          flex-shrink: 0;
          border-right: 0.5px solid var(--color-border-tertiary);
          background: var(--color-background-secondary);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow: hidden;
          z-index: 40;
          transition: transform 0.25s ease;
        }
        @media (max-width: 768px) {
          .app-sidebar {
            position: fixed;
            left: 0;
            top: ${TOPBAR_SAFE_HEIGHT};
            height: calc(100vh - ${TOPBAR_SAFE_HEIGHT});
            height: calc(100dvh - ${TOPBAR_SAFE_HEIGHT});
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
            z-index: 60;
          }
          .app-sidebar.open {
            transform: translateX(0);
          }
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 59;
        }
        .sidebar-overlay.open {
          display: block;
        }
        @media (max-width: 768px) {
          .sidebar-overlay { top: ${TOPBAR_SAFE_HEIGHT}; }
        }

        .mobile-topbar { display: none; }
        @media (max-width: 768px) {
          .mobile-topbar {
            display: flex;
            align-items: center;
            gap: 12px;
            height: ${TOPBAR_SAFE_HEIGHT};
            padding: 0 16px;
            padding-top: env(safe-area-inset-top, 0px);
            background: var(--color-background-secondary);
            border-bottom: 0.5px solid var(--color-border-tertiary);
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 45;
          }
        }
        .mobile-topbar-hamburger {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 20px;
          height: 15px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }
        .mobile-topbar-hamburger span {
          display: block;
          width: 100%;
          height: 2px;
          background: var(--color-text-primary);
          border-radius: 2px;
          transition: all 0.2s;
        }

        .app-main { padding: 32px 36px; }
        @media (max-width: 768px) {
          .app-main { padding: 12px 8px !important; margin-top: ${TOPBAR_SAFE_HEIGHT}; }
        }

        .app-sidebar-footer { padding-bottom: 14px !important; }
        @media (max-width: 768px) {
          .app-sidebar-footer { padding-bottom: max(14px, env(safe-area-inset-bottom)) !important; }
        }
      `}</style>

      <MobileTopBar />

      <aside className="app-sidebar" id="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <BrandWordmark size={17} mono />
        </div>

        {/* Demo mode badge — stands in for the real Plan card */}
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0, background: '#f0fdfa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#0e9488' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0e9488' }}>Demo mode</span>
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
            Fixed example data — no account needed
          </p>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarNav
            projects={projects}
            projectHrefBase="/demo/project"
            tools={[
              { href: '/demo', icon: '⊞', label: 'All projects' },
              { href: '/cennik', icon: '◈', label: 'Pricing' },
            ]}
          />
        </div>

        {/* Footer */}
        <div className="app-sidebar-footer" style={{ borderTop: '0.5px solid var(--color-border-tertiary)', padding: '10px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Link href="/" style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>← Exit demo</Link>
          <Link href="/login" style={{ fontSize: 11, fontWeight: 600, color: '#0e9488', textDecoration: 'none' }}>Sign up free →</Link>
        </div>
      </aside>
    </>
  )
}
