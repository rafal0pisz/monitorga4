import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'
import { effectivePlanId, canUseTeamFeature } from '@/lib/billing/plans'

const GROUP_PREFIX = 'GROUP - '

// Owner-only: create/rename/delete a project group. A group's whole point
// is to grant team access once and have it cover every project placed in
// it (now or later, see src/lib/team/access.ts) — eligibility mirrors
// team invites exactly (Pro/Agency/trial).
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const rawName = typeof body.name === 'string' ? body.name.trim() : ''
  if (!rawName) return NextResponse.json({ error: 'Enter a group name' }, { status: 400 })
  // Consistent naming convention regardless of what the owner typed —
  // "Bettersteps" and "GROUP - Bettersteps" both end up as the latter, so
  // groups are never ambiguous with plain project names in any list.
  const name = rawName.toLowerCase().startsWith(GROUP_PREFIX.toLowerCase()) ? rawName : `${GROUP_PREFIX}${rawName}`

  const admin = createAdminClient()
  const { data: profile, error: profileErr } = await admin.from('profiles').select('plan_id, trial_ends_at').eq('id', user.id).single()
  if (profileErr) return NextResponse.json({ error: 'Could not check your plan — please try again.' }, { status: 500 })
  if (!canUseTeamFeature(effectivePlanId(profile?.plan_id, profile?.trial_ends_at))) {
    return NextResponse.json({ error: 'Groups are available on the Pro and Agency plans.' }, { status: 403 })
  }

  const { data: group, error: insertErr } = await admin.from('project_groups')
    .insert({ owner_id: user.id, name })
    .select('id, name').single()
  if (insertErr) {
    if (insertErr.code === '23505') return NextResponse.json({ error: 'You already have a group with that name.' }, { status: 409 })
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
