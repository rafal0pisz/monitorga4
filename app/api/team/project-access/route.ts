import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Owner-only: grants or revokes one team member's access to one specific
// project. Called from the project's own Settings page ("Team access"
// section) and from the Team page's per-member project list — both are
// just different entry points into the same project_team_members row.
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const teamMemberId = typeof body.teamMemberId === 'string' ? body.teamMemberId : ''
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  const grant = body.grant === true

  if (!teamMemberId || !projectId) {
    return NextResponse.json({ error: 'Missing teamMemberId or projectId' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Both must belong to the SAME owner, and that owner must be the caller —
  // otherwise owner A could grant their own team member access to owner B's
  // project (or vice versa) just by guessing ids.
  const [{ data: project }, { data: teamMember }] = await Promise.all([
    admin.from('projects').select('id, owner_id').eq('id', projectId).single(),
    admin.from('team_members').select('id, owner_id').eq('id', teamMemberId).single(),
  ])
  if (!project || !teamMember || project.owner_id !== user.id || teamMember.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (grant) {
    const { error } = await admin
      .from('project_team_members')
      .upsert({ project_id: projectId, team_member_id: teamMemberId }, { onConflict: 'project_id,team_member_id' })
    if (error) return NextResponse.json({ error: 'Could not grant access — please try again.' }, { status: 500 })
  } else {
    const { error } = await admin
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('team_member_id', teamMemberId)
    if (error) return NextResponse.json({ error: 'Could not revoke access — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
