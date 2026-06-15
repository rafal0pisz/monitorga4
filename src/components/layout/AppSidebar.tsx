import { createAdminClient } from '@/lib/supabase/server'
import SidebarNav from './SidebarNav'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function AppSidebar() {
  const supabase = createAdminClient()
  const { data: projects } = await supabase.from('dashboard_projects').select('id, name, last_score, status').order('name')
  return (
    <aside style={{ width: 220, flexShrink: 0, borderRight: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#16a34a', flexShrink: 0 }}>QS</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>GA4 Quality Score</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.3 }}>monitor.bettersteps.pl</p>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}><SidebarNav projects={(projects ?? []) as any} /></div>
      <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', padding: '10px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Bettersteps · 2026</span>
        <LogoutButton />
      </div>
    </aside>
  )
}
