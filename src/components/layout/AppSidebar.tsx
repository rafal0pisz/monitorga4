import { createClient, createAdminClient } from '@/lib/supabase/server'
import SidebarNav from './SidebarNav'
import LogoutButton from '@/components/ui/LogoutButton'
import BrandWordmark from '@/components/ui/BrandWordmark'
import { planLimit, planName, effectivePlanId } from '@/lib/billing/plans'

export default async function AppSidebar() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let query = supabase
    .from('dashboard_projects')
    .select('id, name, last_score, status')
    .order('name')
  if (!bypass && user) query = query.eq('owner_id', user.id)
  const { data: projects } = await query

  let plan: string | null = null
  let limit: number | null = null
  let trialDaysLeft: number | null = null
  if (!bypass && user) {
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
    if (!profileErr) {
      const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
      plan = planName(effective)
      limit = planLimit(effective)
      if (effective === 'trial' && profile?.trial_ends_at) {
        trialDaysLeft = Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
      }
    }
  }

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
          <div style={{ marginBottom: 2 }}>
            <BrandWordmark size={17} />
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.3 }}>alertga4.bettersteps.pl</p>
          </div>
        </div>

        {/* Plan */}
        {plan && (
          <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Plan: {plan}</span>
              {limit != null && (
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {(projects ?? []).length} / {limit < Number.MAX_SAFE_INTEGER ? limit : '∞'}
                </span>
              )}
            </div>
            {trialDaysLeft != null && (
              <p style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
                {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
              </p>
            )}
          </div>
        )}

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
