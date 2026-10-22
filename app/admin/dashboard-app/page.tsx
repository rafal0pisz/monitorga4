import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminGrowthChart from '@/components/admin/AdminGrowthChart'
import { buildGrowthSeries } from '@/lib/admin/growthStats'
import { fetchAdminStats } from '@/lib/admin/businessStats'
import { fetchRegisteredUsersData, type LicenseInfo } from '@/lib/admin/registeredUsers'
import { isAdminEmail } from '@/lib/admin/isAdminEmail'

const MAX_USERS_SHOWN = 50

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: '18px 20px', flex: '1 1 160px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent ?? 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function AdoptionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
        <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{count} / {total} ({pct}%)</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: 'var(--color-background-tertiary)' }}>
        <div style={{ height: '100%', borderRadius: 3, backgroundColor: '#16a34a', width: `${pct}%` }} />
      </div>
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function licenseTypeStyle(type: LicenseInfo['type']): { bg: string; color: string } {
  switch (type) {
    case 'Trial': return { bg: '#fef9c3', color: '#92400e' }
    case 'Trial (expired)': return { bg: '#fee2e2', color: '#991b1b' }
    case 'Internal': return { bg: '#e5e7eb', color: '#374151' }
    case 'No plan': return { bg: '#f3f4f6', color: '#6b7280' }
    default: return { bg: '#dbeafe', color: '#1e3a8a' }
  }
}

// A plain <table> wrapped in a horizontally-scrolling container — simpler
// and more robust on a data table like this than a card/table hybrid that
// reflows columns into stacked key-value pairs. min-width on the table
// keeps columns readable at any viewport; the wrapper's overflow-x lets a
// phone swipe sideways instead of squishing everything unreadable.
const TableStyle = () => (
  <style>{`
    .ru-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .ru-table { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 12.5px; }
    .ru-table th { text-align: left; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-secondary); padding: 0 10px 8px; white-space: nowrap; }
    .ru-table td { padding: 9px 10px; border-top: 1px solid var(--color-border-tertiary); vertical-align: middle; }
    .ru-table tr:first-child td { border-top: none; }
    .ru-table td:first-child, .ru-table th:first-child {
      position: sticky; left: 0; background: var(--color-background-primary); padding-left: 0;
    }
    .ru-email { color: var(--color-text-primary); word-break: break-all; }
    .ru-badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 20px; white-space: nowrap; }
    .ru-muted { color: var(--color-text-secondary); white-space: nowrap; }
  `}</style>
)

export default async function AdminDashboardPage() {
  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  if (!authData?.user) redirect('/login')

  if (!isAdminEmail(authData.user.email)) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access denied</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          This page is restricted to the AlertGA4 admin account.
        </p>
      </div>
    )
  }

  const admin = createAdminClient()

  const [{ rows, projects, activeCount, pausedCount, blockedByBillingCount }, stats] = await Promise.all([
    fetchRegisteredUsersData(admin),
    fetchAdminStats(admin),
  ])

  const projectDates = projects.map(p => new Date(p.created_at))
  const userDates = rows.map(r => new Date(r.createdAt))
  const growth = buildGrowthSeries(userDates, projectDates)
  const totalUsers = rows.length
  const activationPct = totalUsers > 0 ? Math.round((stats.usersWithProject / totalUsers) * 100) : 0
  const totalRuns30d = stats.workerRunsCompleted30d + stats.workerRunsFailed30d
  const successRatePct = totalRuns30d > 0 ? Math.round((stats.workerRunsCompleted30d / totalRuns30d) * 100) : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>
      <nav style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Admin</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Business overview</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>Signups, projects, and growth — visible only to the AlertGA4 team.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <StatTile label="Registered users" value={totalUsers} />
          <StatTile label="Total projects" value={projects.length} />
          <StatTile label="Active projects (data flowing)" value={activeCount} accent="#16a34a" />
          <StatTile label="Paused projects" value={pausedCount} accent="#9ca3af" />
          <StatTile label="Blocked by billing" value={blockedByBillingCount} accent={blockedByBillingCount > 0 ? '#ea580c' : undefined} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <StatTile label="Activated users" value={`${stats.usersWithProject}/${totalUsers} (${activationPct}%)`} />
          <StatTile label="Avg. score (active)" value={stats.avgScore != null ? Math.round(stats.avgScore) : '—'} />
          <StatTile label="Median score (active)" value={stats.medianScore != null ? Math.round(stats.medianScore) : '—'} />
          <StatTile label="Worker success (30d)" value={successRatePct != null ? `${successRatePct}%` : '—'} accent={successRatePct != null && successRatePct < 90 ? '#dc2626' : undefined} />
          <StatTile label="Alerts sent (30d)" value={stats.alertsSent30d} />
          <StatTile label="Needs Google reconnect" value={stats.disconnectedOwners} accent={stats.disconnectedOwners > 0 ? '#ea580c' : undefined} />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Growth</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Cumulative users and projects over time</div>
          <AdminGrowthChart data={growth} />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Configuration adoption</div>
          <AdoptionRow label="Auto-run enabled" count={stats.autoRunEnabled} total={stats.totalActiveProjects} />
          <AdoptionRow label="Custom events" count={stats.customEventsAdoption} total={stats.totalActiveProjects} />
          <AdoptionRow label="Ecommerce checks" count={stats.ecommerceAdoption} total={stats.totalActiveProjects} />
          <AdoptionRow label="Parameter checks" count={stats.parametersAdoption} total={stats.totalActiveProjects} />
        </div>

        <TableStyle />
        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Registered users</div>
            <a
              href="/api/admin/registered-users.csv"
              style={{ fontSize: 11.5, fontWeight: 600, color: '#1e3a8a', textDecoration: 'none', padding: '4px 10px', borderRadius: 7, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}
            >
              ⬇ Export CSV
            </a>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Newest first{rows.length > MAX_USERS_SHOWN ? ` — showing ${MAX_USERS_SHOWN} of ${rows.length} (full list in the CSV export)` : ''}
          </div>
          {rows.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No registered users yet.</div>
          ) : (
            <div className="ru-scroll">
              <table className="ru-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Registered</th>
                    <th>Plan</th>
                    <th>Type</th>
                    <th>Started</th>
                    <th>Valid until</th>
                    <th>Projects</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, MAX_USERS_SHOWN).map(r => {
                    const typeStyle = licenseTypeStyle(r.license.type)
                    return (
                      <tr key={r.id}>
                        <td className="ru-email">{r.email ?? '—'}</td>
                        <td className="ru-muted">{fmtDate(r.createdAt)}</td>
                        <td>
                          <span className="ru-badge" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                            {r.license.plan}
                          </span>
                        </td>
                        <td className="ru-muted">{r.license.type}</td>
                        <td className="ru-muted">{r.license.startedAt ? fmtDate(r.license.startedAt) : '—'}</td>
                        <td className="ru-muted">
                          {r.license.untilAt
                            ? `${fmtDate(r.license.untilAt)}${r.license.canceling ? ' (canceling)' : ''}`
                            : r.license.type === 'Internal' ? 'No expiry' : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {r.activeProjects > 0 && (
                              <span className="ru-badge" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                {r.activeProjects} active
                              </span>
                            )}
                            {r.blockedProjects > 0 && (
                              <span className="ru-badge" style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
                                {r.blockedProjects} blocked
                              </span>
                            )}
                            {r.activeProjects === 0 && r.blockedProjects === 0 && <span className="ru-muted">—</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
