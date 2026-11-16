import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { getAccessibleOwnerIds } from '@/lib/team/access'
import { effectivePlanId, canUseTeamFeature } from '@/lib/billing/plans'

const GROUP_PREFIX = 'GROUP - '

// Create/rename/delete a project group via this API route (the owner-
// initiated "Create a group" box, or the new-project wizard's "+ Create new
// group" option) — gated to Pro/Agency/trial, since Lite has no
// team-access feature to use a group for anyway. This is separate from
// create_project's own server-side "GROUP - Default" fallback (which calls
// Postgres directly, not this route), so every Lite project still always
// ends up grouped automatically without needing this endpoint.
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

  const admin = createAdminClient()
  const { data: ownerProfile, error: ownerProfileErr } = await admin.from('profiles')
    .select('plan_id, trial_ends_at').eq('id', ownerId).single()
  if (ownerProfileErr) {
    return NextResponse.json({ error: 'Could not check the plan — please try again.' }, { status: 500 })
  }
  const effective = effectivePlanId(ownerProfile?.plan_id, ownerProfile?.trial_ends_at)
  if (!canUseTeamFeature(effective)) {
    return NextResponse.json({ error: 'Creating groups is available on the Pro and Agency plans.' }, { status: 403 })
  }

  // Consistent naming convention regardless of what the owner typed —
  // "Bettersteps" and "GROUP - Bettersteps" both end up as the latter, so
  // groups are never ambiguous with plain project names in any list.
  const name = rawName.toLowerCase().startsWith(GROUP_PREFIX.toLowerCase()) ? rawName : `${GROUP_PREFIX}${rawName}`

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
