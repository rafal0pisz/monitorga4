import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Owner-only: grants or revokes one team member's access to a whole GROUP
// of projects at once. No cap check here beyond ownership — the only
// team-size limit is the account-wide seat count enforced at invite time
// (maxTeamSeats(), src/lib/billing/plans.ts); granting an already-invited
// member another group doesn't add to that count, so there's nothing
// further to enforce.
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
