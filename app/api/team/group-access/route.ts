import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, maxMembersPerProject } from '@/lib/billing/plans'

// Owner-only: grants or revokes one team member's access to a whole GROUP
// of projects at once — the project-level equivalent is
// app/api/team/project-access/route.ts. The per-service member cap
// (src/lib/billing/plans.ts, 3 for Pro/trial) applies to a group the same
// way it does to a single project: a group is just a bundle of services,
// not a way around the cap.
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const teamMemberId = typeof body.teamMemberId === 'string' ? body.teamMemberId : ''
  const groupId = typeof body.groupId === 'string' ? body.groupId : ''
  const grant = body.grant === true

  if (!teamMemberId || !groupId) {
    return NextResponse.json({ error: 'Missing teamMemberId or groupId' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [{ data: group }, { data: teamMember }] = await Promise.all([
    admin.from('project_groups').select('id, owner_id').eq('id', groupId).single(),
    admin.from('team_members').select('id, owner_id').eq('id', teamMemberId).single(),
  ])
  if (!group || !teamMember || group.owner_id !== user.id || teamMember.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (grant) {
    const { data: already } = await admin
      .from('group_team_members').select('id').eq('group_id', groupId).eq('team_member_id', teamMemberId).maybeSingle()
    if (!already) {
      const { data: profile } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
      const cap = maxMembersPerProject(effectivePlanId(profile?.plan_id, profile?.trial_ends_at))
      const { count: grantedCount, error: grantedErr } = await admin
        .from('group_team_members').select('id', { count: 'exact', head: true }).eq('group_id', groupId)
      if (grantedErr) return NextResponse.json({ error: 'Could not check this group\'s team access — please try again.' }, { status: 500 })
      if ((grantedCount ?? 0) >= cap) {
        return NextResponse.json({ error: `Your plan allows up to ${cap} people per service/group. Remove someone from it first to add a new person.` }, { status: 409 })
      }
    }
    const { error } = await admin
      .from('group_team_members')
      .upsert({ group_id: groupId, team_member_id: teamMemberId }, { onConflict: 'group_id,team_member_id' })
    if (error) return NextResponse.json({ error: 'Could not grant access — please try again.' }, { status: 500 })
  } else {
    const { error } = await admin
      .from('group_team_members')
      .delete()
      .eq('group_id', groupId)
      .eq('team_member_id', teamMemberId)
    if (error) return NextResponse.json({ error: 'Could not revoke access — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
