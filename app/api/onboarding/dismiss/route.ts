import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })

  const supabase = createAdminClient()
  await supabase.from('profiles').update({ onboarding_dismissed_at: new Date().toISOString() }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
