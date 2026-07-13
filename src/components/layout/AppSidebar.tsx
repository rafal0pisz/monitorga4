import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import SidebarNav from './SidebarNav'
import MobileTopBar from './MobileTopBar'
import LogoutButton from '@/components/ui/LogoutButton'
import BrandWordmark from '@/components/ui/BrandWordmark'
import { planLimit, planName, effectivePlanId } from '@/lib/billing/plans'

const MOBILE_TOPBAR_HEIGHT = 52
// Notched/Dynamic-Island phones need extra clearance above the topbar's own
// 52px content — without env(safe-area-inset-top), the fixed topbar (and
// everything sized relative to its height) assumed a flat 52px regardless of
// device, which could leave content below it overlapping the topbar on
// devices where the safe area eats into that budget.
const TOPBAR_SAFE_HEIGHT = `calc(${MOBILE_TOPBAR_HEIGHT}px + env(safe-area-inset-top, 0px))`

export default async function AppSidebar() {
  const user = await getAuthUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  const supabase = createAdminClient()
  let projectsQuery = supabase
    .from('dashboard_projects')
    .select('id, name, last_score, status')
    .order('name')
  if (!bypass && user) projectsQuery = projectsQuery.eq('owner_id', user.id)

  // Independent queries — same owner_id, no data dependency between them —
  // so they run as one round trip instead of two sequential ones.
  const [{ data: projects }, { data: profile, error: profileErr }] = await Promise.all([
    projectsQuery,
    !bypass && user
      ? supabase.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  let plan: string | null = null
  let limit: number | null = null
  let trialDaysLeft: number | null = null
  if (!bypass && user && !profileErr) {
    const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
    plan = planName(effective)
    limit = planLimit(effective)
    if (effective === 'trial' && profile?.trial_ends_at) {
      trialDaysLeft = Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
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
            top: ${TOPBAR_SAFE_HEIGHT};
            /* 100vh on mobile browsers includes the address-bar area that
               isn't actually visible, which was pushing the footer (and its
               Sign out button) below the real fold. 100dvh tracks the
               actual visible viewport; the vh line above is just a fallback
               for browsers that don't support dvh yet. */
            height: calc(100vh - ${TOPBAR_SAFE_HEIGHT});
            height: calc(100dvh - ${TOPBAR_SAFE_HEIGHT});
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
            /* Page content can have its own sticky bars with a higher
               z-index than this drawer's base 40 (e.g. the project page's
               sub-nav at 50) — without this override, opening the drawer
               left that sub-nav painting on top of it instead of being
               covered like the rest of the page. 60 beats anything
               currently used in page content. */
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
          /* Must stay above in-page sticky content (see .app-sidebar z-index
             note above) and below the drawer itself. */
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
          /* position: fixed (not sticky) deliberately — this sits inside the
             same flex row as .app-sidebar/.app-main, so sticky would just
             make it a 3rd flex item next to them instead of a full-width bar
             above both. Fixed takes it out of that flow entirely. */
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

        .app-sidebar-footer { padding-bottom: 10px; }
        @media (max-width: 768px) {
          /* Clears the home-indicator area on notched phones so the Sign
             out button isn't flush against (or hidden under) it. */
          .app-sidebar-footer { padding-bottom: max(10px, env(safe-area-inset-bottom)); }
        }
      `}</style>

      <MobileTopBar />

      <aside className="app-sidebar" id="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <BrandWordmark size={17} mono />
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
        <div className="app-sidebar-footer" style={{ borderTop: '0.5px solid var(--color-border-tertiary)', padding: '10px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>AlertGA4 {new Date().getFullYear()}</span>
          <LogoutButton style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'underline', padding: '2px 0' }} />
        </div>
      </aside>
    </>
  )
}
