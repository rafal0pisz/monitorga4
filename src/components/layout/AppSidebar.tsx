import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import SidebarNav from './SidebarNav'
import MobileTopBar from './MobileTopBar'
import LogoutButton from '@/components/ui/LogoutButton'
import BrandWordmark from '@/components/ui/BrandWordmark'
import { planLimit, planName, effectivePlanId } from '@/lib/billing/plans'
import { getTeamContext, getGrantedProjectIds } from '@/lib/team/access'
import { getMemberAccessiblePropertyIds } from '@/lib/ga4/memberAccess'

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
  // "Own" and "Team" are independent contexts (see src/lib/team/access.ts)
  // — the project list below shows both, but the Plan card always reflects
  // YOUR OWN profile/limit, never a team you're also on.
  const teamContext = !bypass && user ? await getTeamContext(user.id) : null

  // Own projects and projects explicitly granted via an accepted team
  // membership (src/lib/team/access.ts) are two separate queries now —
  // being on someone's team no longer implies visibility into every one of
  // their projects, only the ones they've specifically granted. Combining
  // them here (rather than one query filtered by owner_id) is what stops a
  // team member from seeing every other client's project name.
  const grantedProjectIds = !bypass && user && teamContext?.isMember ? await getGrantedProjectIds(user.id) : []

  const projectCols = 'id, name, last_score, status, owner_id, ga4_property_id, group_id'
  const ownProjectsQuery = !bypass && user
    ? supabase.from('dashboard_projects').select(projectCols).eq('owner_id', user.id).order('name')
    : supabase.from('dashboard_projects').select(projectCols).order('name')
  const grantedProjectsQuery = grantedProjectIds.length > 0
    ? supabase.from('dashboard_projects').select(projectCols).in('id', grantedProjectIds).order('name')
    : Promise.resolve({ data: [] as any[], error: null })

  // Independent queries — no data dependency between them — so they run as
  // one round trip instead of several sequential ones.
  const [{ data: ownProjects }, { data: grantedProjects }, { data: profile, error: profileErr }, memberPropertyIds] = await Promise.all([
    ownProjectsQuery,
    grantedProjectsQuery,
    !bypass && user
      ? supabase.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
    !bypass && user && teamContext?.isMember ? getMemberAccessiblePropertyIds(user.id) : Promise.resolve(null),
  ])
  const projects = [...(ownProjects ?? []), ...(grantedProjects ?? [])]

  // Group names for whichever groups these projects actually belong to —
  // not scoped to one owner_id, since a team member's granted projects
  // belong to groups on the TEAM OWNER's account, not their own.
  const groupIds = [...new Set(projects.map((p: any) => p.group_id).filter(Boolean))]
  const { data: groupRows } = groupIds.length > 0
    ? await supabase.from('project_groups').select('id, name').in('id', groupIds)
    : { data: [] as { id: string; name: string }[] }
  const groupNameById = new Map((groupRows ?? []).map((g: any) => [g.id, g.name as string]))

  // Same rule as the dashboard — team membership alone doesn't unlock a
  // project's actual data, only Google's own, separately granted access
  // does. See src/lib/ga4/memberAccess.ts. isOwn drives the "Your
  // projects" / "Team" split in SidebarNav.
  const sidebarProjects = (projects ?? []).map((p: any) => ({
    ...p,
    isOwn: p.owner_id === user?.id,
    locked: !!memberPropertyIds && p.owner_id !== user?.id && !memberPropertyIds.has(p.ga4_property_id),
    groupName: p.group_id ? groupNameById.get(p.group_id) : undefined,
  }))
  const ownProjectCount = sidebarProjects.filter((p: any) => p.owner_id === user?.id).length

  let plan: string | null = null
  let limit: number | null = null
  let trialDaysLeft: number | null = null
  if (!bypass && user && !profileErr) {
    const effective = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
    // Hide the card entirely rather than show "No plan" — for someone who's
    // purely a team member and never intended to have their own plan, that
    // reads as an alarm, not information.
    if (effective !== null) {
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

        /* !important needed: the footer div's inline padding shorthand
           (below) sets padding-bottom: 0 directly, which otherwise beats a
           plain class rule regardless of media query. */
        .app-sidebar-footer { padding-bottom: 14px !important; }
        @media (max-width: 768px) {
          /* Clears the home-indicator area on notched phones so the Sign
             out button isn't flush against (or hidden under) it. */
          .app-sidebar-footer { padding-bottom: max(14px, env(safe-area-inset-bottom)) !important; }
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
                  {ownProjectCount} / {limit < Number.MAX_SAFE_INTEGER ? limit : '∞'}
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

        {/* Nav — SidebarNav itself splits this into a scrollable projects
            region and a scrollable Tools region (see there), so this
            wrapper must NOT scroll on its own — scrolling at both levels is
            what used to require two separate scrolls to reach Tools. */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SidebarNav projects={sidebarProjects} />
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
