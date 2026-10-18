import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Removes a team member or revokes a pending invite — same action either
// way, since both are just a row in team_members. Owner-only: a member
// can't remove themselves or anyone else from here (if they need to leave,
// that's a "remove me" request to the owner for now, not self-service).
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const memberRowId = typeof body.id === 'string' ? body.id : ''
  if (!memberRowId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  // owner_id filter on the delete itself — not just a prior existence check
  // — so this can never remove a row from someone else's team even if the
  // id was guessed/copied.
  const { error, count } = await admin.from('team_members')
    .delete({ count: 'exact' })
    .eq('id', memberRowId)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: 'Could not remove — please try again.' }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
