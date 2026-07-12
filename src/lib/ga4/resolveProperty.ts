import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Resolved = { propertyId: string } | { error: NextResponse }

// A couple of GA4 endpoints are called both for an existing, owned project
// (settings page, "suggest events") AND before any project exists yet (the
// new-project wizard, picking which GA4 property to connect — there's no
// projects row to check ownership against at that point).
//
// Accept exactly one of:
//  - projectId  — ownership-checked against `projects.owner_id`, propertyId
//                 read from the DB, never trusted from the client.
//  - propertyId — trusted directly, but ONLY because getGa4Token() never
//                 falls back to a shared/default account for a signed-in
//                 user without their own GA4 connection (see
//                 src/lib/ga4/token.ts) — Google's own permissions on that
//                 user's token are the real authorization boundary here.
export async function resolvePropertyId(searchParams: URLSearchParams): Promise<Resolved> {
  const projectId = searchParams.get('projectId')
  const rawPropertyId = searchParams.get('propertyId')

  if (projectId && rawPropertyId) {
    return { error: NextResponse.json({ error: 'Pass either projectId or propertyId, not both' }, { status: 400 }) }
  }

  if (projectId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    const admin = createAdminClient()
    const { data: project } = await admin
      .from('projects')
      .select('ga4_property_id, owner_id')
      .eq('id', projectId)
      .single()

    // 404, not 403 — don't confirm to the caller that a project id they
    // don't own exists at all.
    if (!project || project.owner_id !== user.id) {
      return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
    }
    return { propertyId: project.ga4_property_id }
  }

  if (rawPropertyId) {
    return { propertyId: rawPropertyId }
  }

  return { error: NextResponse.json({ error: 'Missing projectId or propertyId' }, { status: 400 }) }
}
