'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { scoreColor } from '@/types'

interface Project {
  id: string
  name: string
  last_score: number | null
  status: string
  locked?: boolean
  // Whether this is your own project (owner_id = you) vs one shared via a
  // team you're a member of. Only present when AppSidebar actually fetched
  // team-aware data — absent (e.g. demo mode) means "treat as your own".
  isOwn?: boolean
}

function scoreDotColor(score: number | null): string {
  return score === null ? '#d1d5db' : scoreColor(score)
}

interface ToolLink { href: string; icon: string; label: string }

const DEFAULT_TOOLS: ToolLink[] = [
  { href: '/dashboard/new',     icon: '＋', label: 'New project' },
  { href: '/dashboard',         icon: '⊞', label: 'All projects' },
  { href: '/dashboard/billing', icon: '◈', label: 'Billing' },
  { href: '/dashboard/team',    icon: '◎', label: 'Team' },
  { href: '/dashboard/help',    icon: '?', label: 'Help' },
]

function ProjectRow({ p, active, projectHrefBase }: { p: Project; active: boolean; projectHrefBase: string }) {
  return (
    <Link key={p.id} href={`${projectHrefBase}/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px',
        borderLeft: active ? '2px solid #16a34a' : '2px solid transparent',
        background: active ? 'var(--color-background-primary)' : 'transparent',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: p.locked ? 'var(--color-text-tertiary)' : scoreDotColor(p.last_score) }} />
        <span style={{
          fontSize: 13,
          color: p.locked ? 'var(--color-text-tertiary)' : active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          fontWeight: active ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {p.name}
        </span>
        {p.locked ? (
          <span style={{ fontSize: 11, marginLeft: 'auto', flexShrink: 0 }}>🔒</span>
        ) : p.last_score !== null && (
          <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 'auto', flexShrink: 0, color: scoreDotColor(p.last_score) }}>
            {Math.round(p.last_score)}
          </span>
        )}
      </div>
    </Link>
  )
}

function ProjectGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', padding: '0 16px', margin: '0 0 4px' }}>
      {children}
    </p>
  )
}

export default function SidebarNav({
  projects, projectHrefBase = '/project', tools = DEFAULT_TOOLS,
}: {
  projects: Project[]
  projectHrefBase?: string
  tools?: ToolLink[]
}) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Only split into "Your projects" / "Team" when there's actually a team
  // project to show — everyone else keeps the single flat "Projects" list
  // they've always had.
  const teamProjects = projects.filter(p => p.isOwn === false)
  const ownProjects = projects.filter(p => p.isOwn !== false)
  const hasTeamProjects = teamProjects.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Projects */}
        <div style={{ padding: '14px 0 8px' }}>
          <ProjectGroupLabel>{hasTeamProjects ? 'Your projects' : 'Projects'}</ProjectGroupLabel>
          <div style={{ overflowY: 'auto', maxHeight: hasTeamProjects ? 180 : 360 }}>
            {ownProjects.map(p => (
              <ProjectRow key={p.id} p={p} active={isActive(`${projectHrefBase}/${p.id}`)} projectHrefBase={projectHrefBase} />
            ))}
            {ownProjects.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '6px 16px', margin: 0 }}>
                No projects yet
              </p>
            )}
          </div>
        </div>

        {hasTeamProjects && (
          <div style={{ padding: '4px 0 8px' }}>
            <ProjectGroupLabel>Team</ProjectGroupLabel>
            <div style={{ overflowY: 'auto', maxHeight: 180 }}>
              {teamProjects.map(p => (
                <ProjectRow key={p.id} p={p} active={isActive(`${projectHrefBase}/${p.id}`)} projectHrefBase={projectHrefBase} />
              ))}
            </div>
          </div>
        )}

        <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '4px 16px' }} />

        {/* Tools */}
        <div style={{ padding: '8px 0' }}>
          <ProjectGroupLabel>Tools</ProjectGroupLabel>
          {tools.map(item => {
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
  )
}
