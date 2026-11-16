import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Owner-only: assigns or unassigns ONE project to/from ONE group. A
// project belongs to at most one group — assigning it to group B while it
// was already in group A just moves it (set group_id directly), no
// separate "remove from A" step needed.
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  const groupId = typeof body.groupId === 'string' ? body.groupId : ''
  const add = body.add === true

  if (!projectId || !groupId) {
    return NextResponse.json({ error: 'Missing projectId or groupId' }, { status: 400 })
  }

  const admin = createAdminClient()
  const [{ data: project }, { data: group }] = await Promise.all([
    admin.from('projects').select('id, owner_id, group_id').eq('id', projectId).single(),
    admin.from('project_groups').select('id, owner_id').eq('id', groupId).single(),
  ])
  if (!project || !group || project.owner_id !== user.id || group.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Unassigning only actually clears it if this project is still in THIS
  // group — a stale/duplicate request for a project someone already moved
  // elsewhere must not accidentally rip it back out of its new group.
  const { error } = add
    ? await admin.from('projects').update({ group_id: groupId }).eq('id', projectId)
    : await admin.from('projects').update({ group_id: null }).eq('id', projectId).eq('group_id', groupId)
  if (error) return NextResponse.json({ error: 'Could not update the group — please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
