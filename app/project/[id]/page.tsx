import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const admin = createAdminClient()
  const { data: project, error: projErr } = await admin
    .from('projects')
    .select('id, name, ga4_property_id, status')
    .eq('id', id)
    .single()

  const { data: runs, error: runsErr } = await admin
    .from('dqs_runs')
    .select('id, run_date, score_total, status')
    .eq('project_id', id)
    .order('run_date', { ascending: false })
    .limit(3)

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 13 }}>
      <h2>DIAGNOSTIC PAGE — {id}</h2>
      <hr />
      <h3>Auth</h3>
      <pre>{JSON.stringify({ user: authData?.user?.email ?? null, error: authErr?.message ?? null }, null, 2)}</pre>
      <h3>Project</h3>
      <pre>{JSON.stringify({ data: project, error: projErr?.message ?? null }, null, 2)}</pre>
      <h3>Runs</h3>
      <pre>{JSON.stringify({ data: runs, error: runsErr?.message ?? null }, null, 2)}</pre>
    </div>
  )
}
