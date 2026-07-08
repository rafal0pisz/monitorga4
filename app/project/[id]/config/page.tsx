import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Project, ChecksCatalog, ChecksConfig, CustomEventCheck, EcommerceConfig, ParameterCheck } from '@/types'
import Link from 'next/link'
import ProjectConfigForm from '@/components/project/ProjectConfigForm'
import AccountMismatch from '@/components/project/AccountMismatch'

export default async function ProjectConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await createClient()
  const { data: authData } = await session.auth.getUser()
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass && !authData?.user) redirect('/login')

  const supabase = createAdminClient()

  // Fetch (and authorize) the project before touching the RPCs below — those
  // now reject non-owners server-side, which would otherwise throw and blow
  // up this whole Promise.all instead of showing a friendly message.
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()
  if (!bypass && project.owner_id !== authData!.user!.id) return <AccountMismatch />

  const [
    { data: catalog },
    { data: checksConfig },
    { data: customEventsRaw },
    { data: ecommerceConfigRaw },
    { data: parameterChecksRaw },
    { data: sectionsRaw },
  ] = await Promise.all([
    supabase.from('checks_catalog').select('*').order('level').order('check_key'),
    supabase.from('checks_config').select('*').eq('project_id', id),
    supabase.rpc('get_custom_event_checks', { p_project_id: id }),
    supabase.rpc('get_ecommerce_config', { p_project_id: id }),
    supabase.rpc('get_parameter_checks', { p_project_id: id }),
    supabase.rpc('get_project_sections', { p_project_id: id }),
  ])

  // RPC returns jsonb arrays — parse if needed
  const parseRpc = (raw: any) => {
    if (!raw) return []
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
    return Array.isArray(raw) ? raw : []
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <Link href={`/project/${id}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{project.name}</Link>
        <span>/</span>
        <span style={{ color: '#111827' }}>Settings</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px', color: '#111827' }}>Project settings</h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 24px', fontFamily: 'monospace' }}>{project.ga4_property_id}</p>

      <ProjectConfigForm
        project={project as Project}
        catalog={(catalog ?? []) as ChecksCatalog[]}
        checksConfig={(checksConfig ?? []) as ChecksConfig[]}
        customEvents={parseRpc(customEventsRaw) as CustomEventCheck[]}
        ecommerceConfig={parseRpc(ecommerceConfigRaw) as EcommerceConfig[]}
        parameterChecks={parseRpc(parameterChecksRaw) as ParameterCheck[]}
        ecommerceCatalog={[]}
        initialSections={sectionsRaw && typeof sectionsRaw === 'object' ? sectionsRaw as any : undefined}
      />
    </div>
  )
}
