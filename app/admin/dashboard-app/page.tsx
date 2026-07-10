import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminGrowthChart from '@/components/admin/AdminGrowthChart'
import { fetchAllUserCreatedDates, buildGrowthSeries } from '@/lib/admin/growthStats'
import { fetchAdminStats } from '@/lib/admin/businessStats'

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}

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

  const [userDates, { data: projectsRaw }, stats] = await Promise.all([
    fetchAllUserCreatedDates(admin),
    admin.from('projects').select('created_at, status'),
    fetchAdminStats(admin),
  ])

  const projects = (projectsRaw ?? []) as { created_at: string; status: string }[]
  const projectDates = projects.map(p => new Date(p.created_at))
  const activeCount = projects.filter(p => p.status === 'active').length
  const pausedCount = projects.filter(p => p.status === 'paused').length

  const growth = buildGrowthSeries(userDates, projectDates)
  const totalUsers = userDates.length
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
          <StatTile label="Active projects" value={activeCount} accent="#16a34a" />
          <StatTile label="Paused projects" value={pausedCount} accent="#9ca3af" />
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: '1 1 320px', backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Configuration adoption</div>
            <AdoptionRow label="Auto-run enabled" count={stats.autoRunEnabled} total={stats.totalActiveProjects} />
            <AdoptionRow label="Custom events" count={stats.customEventsAdoption} total={stats.totalActiveProjects} />
            <AdoptionRow label="Ecommerce checks" count={stats.ecommerceAdoption} total={stats.totalActiveProjects} />
            <AdoptionRow label="Parameter checks" count={stats.parametersAdoption} total={stats.totalActiveProjects} />
          </div>

          <div style={{ flex: '1 1 320px', backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Needs attention</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Active projects currently below their own alert threshold</div>
            {stats.belowThreshold.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nothing below threshold right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.belowThreshold.slice(0, 10).map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2', textDecoration: 'none' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--color-text-primary)', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{Math.round(p.score)} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>/ {p.threshold}</span></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
