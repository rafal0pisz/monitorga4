import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_REASONS = new Set(['price', 'no_time', 'not_needed', 'other'])

// Public, unauthenticated by design — reached from a one-click link in the
// trial win-back email, not a logged-in session (see middleware.ts's
// AUTH_EXEMPT_API_PATHS). Authorizes via the random per-profile token
// issued alongside that email (profiles.trial_winback_token) instead of a
// Supabase session.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const reason = request.nextUrl.searchParams.get('reason')

  if (!token || !reason || !VALID_REASONS.has(reason)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('id').eq('trial_winback_token', token).maybeSingle()
  if (!profile) return NextResponse.redirect(new URL('/', request.url))

  // Idempotent — clicking the same or a different reason link again (e.g.
  // a mail client prefetching links) doesn't create duplicate rows or
  // overwrite the first real answer.
  const { data: existing } = await admin.from('trial_winback_responses').select('id').eq('profile_id', profile.id).maybeSingle()
  if (!existing) {
    await admin.from('trial_winback_responses').insert({ profile_id: profile.id, reason })
  }

  return NextResponse.redirect(new URL('/trial-winback/thanks', request.url))
}
