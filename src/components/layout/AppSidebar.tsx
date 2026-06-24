import { createAdminClient } from '@/lib/supabase/server'
import SidebarNav from './SidebarNav'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function AppSidebar() {
  const supabase = createAdminClient()
  const { data: projects } = await supabase
    .from('dashboard_projects')
    .select('id, name, last_score, status')
    .order('name')

  return (
    <>
      {/* Responsive sidebar styles */}
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
            top: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
          .app-sidebar.open {
            transform: translateX(0);
          }
          .app-main {
            margin-left: 0 !important;
          }
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 39;
        }
        .sidebar-overlay.open {
          display: block;
        }
        .sidebar-hamburger {
          display: none;
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 50;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--color-background-secondary);
          border: 1px solid var(--color-border-tertiary);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          padding: 0;
        }
        @media (max-width: 768px) {
          .sidebar-hamburger { display: flex; }
        }
        .sidebar-hamburger span {
          display: block;
          width: 16px;
          height: 2px;
          background: var(--color-text-primary);
          border-radius: 2px;
          transition: all 0.2s;
        }
      `}</style>

      <aside className="app-sidebar" id="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#16a34a', flexShrink: 0 }}>QS</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>AlertGA4</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.3 }}>alertga4.bettersteps.pl</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarNav projects={(projects ?? []) as any} />
        </div>

        {/* Footer */}
        <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', padding: '10px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Bettersteps · 2026</span>
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
