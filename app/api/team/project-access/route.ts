import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, maxMembersPerProject } from '@/lib/billing/plans'

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
    const { data: already } = await admin
      .from('project_team_members').select('id').eq('project_id', projectId).eq('team_member_id', teamMemberId).maybeSingle()
    if (!already) {
      const { data: profile } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
      const cap = maxMembersPerProject(effectivePlanId(profile?.plan_id, profile?.trial_ends_at))
      const { count: grantedCount, error: grantedErr } = await admin
        .from('project_team_members').select('id', { count: 'exact', head: true }).eq('project_id', projectId)
      if (grantedErr) return NextResponse.json({ error: 'Could not check this project\'s team access — please try again.' }, { status: 500 })
      if ((grantedCount ?? 0) >= cap) {
        return NextResponse.json({ error: `Your plan allows up to ${cap} people on one service. Remove someone from it first to add a new person.` }, { status: 409 })
      }
    }
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
