import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { getAccessibleOwnerIds } from '@/lib/team/access'

const GROUP_PREFIX = 'GROUP - '

// Create/rename/delete a project group. Creating one is NOT gated by plan
// — grouping is an organizational feature everyone gets (every new
// project is placed in a group, even on Lite — see
// supabase/migrations/045_default_groups.sql), separate from whether the
// account can actually GRANT TEAM ACCESS to a group, which stays
// Pro/Agency/trial-only (enforced in /api/team/group-access instead).
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const rawName = typeof body.name === 'string' ? body.name.trim() : ''
  // Optional: lets a team member create a group under the account they're
  // creating a project for (the team owner's), same as create_project's
  // own p_owner_id — not just their own account.
  const ownerId = typeof body.ownerId === 'string' ? body.ownerId : user.id
  if (!rawName) return NextResponse.json({ error: 'Enter a group name' }, { status: 400 })
  if (!(await getAccessibleOwnerIds(user.id)).includes(ownerId)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  // Consistent naming convention regardless of what the owner typed —
  // "Bettersteps" and "GROUP - Bettersteps" both end up as the latter, so
  // groups are never ambiguous with plain project names in any list.
  const name = rawName.toLowerCase().startsWith(GROUP_PREFIX.toLowerCase()) ? rawName : `${GROUP_PREFIX}${rawName}`

  const admin = createAdminClient()
  const { data: group, error: insertErr } = await admin.from('project_groups')
    .insert({ owner_id: ownerId, name })
    .select('id, name').single()
  if (insertErr) {
    if (insertErr.code === '23505') return NextResponse.json({ error: 'That account already has a group with that name.' }, { status: 409 })
    return NextResponse.json({ error: 'Could not create the group — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, group })
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const groupId = typeof body.groupId === 'string' ? body.groupId : ''
  if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

  const admin = createAdminClient()
  // Deleting the group row alone is enough: projects.group_id is "on delete
  // set null" (migration 044), so every project in it just becomes
  // ungrouped rather than disappearing or erroring, and
  // group_team_members cascades away with it.
  const { error, count } = await admin.from('project_groups').delete({ count: 'exact' }).eq('id', groupId).eq('owner_id', user.id)
  if (error) return NextResponse.json({ error: 'Could not delete the group — please try again.' }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
