import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector  from '@/components/project/PeriodSelector'
import RunNowButton    from '@/components/project/RunNowButton'
import LiveChecksPanel from '@/components/project/LiveChecksPanel'
import Link from 'next/link'

type RunRow = { id: string; run_date: string; score_total: number | null; status: string }
const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#ca8a04' : '#dc2626'

export default async function ProjectPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id }     = await params
  const { period } = await searchParams
  const periodDays = Number(period) || 7

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const admin = createAdminClient()
  const { data: project } = await admin.from('projects').select('*').eq('id', id).single()
  if (!project) return notFound()

  const { data: runsRaw } = await admin
    .from('dqs_runs').select('id, run_date, score_total, status')
    .eq('project_id', id).order('run_date', { ascending: false }).limit(10)
  const runs = (runsRaw ?? []) as RunRow[]
  const latestRun = runs[0] ?? null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)' }}>
      <nav style={{ backgroundColor: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-tertiary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
            <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{project.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Suspense fallback={<div style={{ width: 200, height: 24 }} />}>
              <PeriodSelector current={periodDays} />
            </Suspense>
            <Link href={`/project/${id}/config`} style={{ fontSize: 12, color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-background-primary)' }}>
              ⚙ Settings
            </Link>
            <RunNowButton projectId={id} />
          </div>
        </div>
      </nav>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ padding: '16px 20px', marginBottom: 28, backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>GA4 Property: {project.ga4_property_id || '—'}</div>
          {latestRun?.score_total != null && (
            <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor(latestRun.score_total), marginTop: 8 }}>
              Score: {Math.round(latestRun.score_total)}
            </div>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Testing LiveChecksPanel…</p>
        {project.ga4_property_id && (
          <LiveChecksPanel propertyId={project.ga4_property_id} period={periodDays} />
        )}
      </div>
    </div>
  )
}
