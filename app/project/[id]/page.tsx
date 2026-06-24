import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PeriodSelector  from '@/components/project/PeriodSelector'
import RunNowButton    from '@/components/project/RunNowButton'
import LiveChecksPanel from '@/components/project/LiveChecksPanel'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
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
  const { data: project } = await admin
    .from('projects').select('*').eq('id', id).single()

  if (!project) return <div>Project not found</div>

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <p>Step 2: + LiveChecksPanel</p>
      <Suspense fallback={<span>loading...</span>}>
        <PeriodSelector current={periodDays} />
      </Suspense>
      <RunNowButton projectId={id} />
      <p>Property: {project.ga4_property_id}</p>
      <LiveChecksPanel propertyId={project.ga4_property_id} period={periodDays} />
    </div>
  )
}
