import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminGrowthChart from '@/components/admin/AdminGrowthChart'
import { fetchAllUserCreatedDates, buildGrowthSeries } from '@/lib/admin/growthStats'

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

  const [userDates, { data: projectsRaw }] = await Promise.all([
    fetchAllUserCreatedDates(admin),
    admin.from('projects').select('created_at, status'),
  ])

  const projects = (projectsRaw ?? []) as { created_at: string; status: string }[]
  const projectDates = projects.map(p => new Date(p.created_at))
  const activeCount = projects.filter(p => p.status === 'active').length
  const pausedCount = projects.filter(p => p.status === 'paused').length

  const growth = buildGrowthSeries(userDates, projectDates)

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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <StatTile label="Registered users" value={userDates.length} />
          <StatTile label="Total projects" value={projects.length} />
          <StatTile label="Active projects" value={activeCount} accent="#16a34a" />
          <StatTile label="Paused projects" value={pausedCount} accent="#9ca3af" />
        </div>

        <div style={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Growth</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Cumulative users and projects over time</div>
          <AdminGrowthChart data={growth} />
        </div>
      </div>
    </div>
  )
}
