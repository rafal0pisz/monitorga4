import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Only a same-origin relative path is ever honored — "next" rides through
// the OAuth round trip as a plain query param, so treating it as a trusted
// redirect target without this check would be an open redirect.
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (!code) {
    console.error('[auth/callback] Missing code param')
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] Session exchange failed:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=session_failed`)
  }

  const { session } = data
  const providerToken        = session.provider_token         // access token (expires ~1h)
  const providerRefreshToken = session.provider_refresh_token // refresh token (long-lived)
  const userId               = session.user.id

  // Always keep profiles.email in sync on every login — used by the team
  // invite flow (app/api/team/invite) to warn up front when the invited
  // email already has its own AlertGA4 account, instead of only finding
  // out when that person tries to accept. Previously this whole upsert
  // (and so the email sync) only ran when Google returned a provider
  // token, which meant an existing user's email was never backfilled here
  // at all if GA4 tokens were saved by some other path.
  const admin = createAdminClient()
  const basePayload: Record<string, string | null> = {
    id: userId,
    org_id: '00000000-0000-0000-0000-000000000001',
    full_name: session.user.user_metadata?.full_name ?? null,
    email: session.user.email ?? null,
  }

  if (providerToken || providerRefreshToken) {
    // Save tokens to profiles table so the worker can refresh GA4 access
    // without requiring an active user session.
    basePayload.ga4_access_token = providerToken ?? null
    basePayload.ga4_token_expiry = providerToken
      ? new Date(Date.now() + 3500 * 1000).toISOString() // ~58 min
      : null
    // Only overwrite refresh_token when Google issues a new one
    // (Google only sends it on first consent or when prompt=consent is used)
    if (providerRefreshToken) {
      basePayload.ga4_refresh_token = providerRefreshToken
    }
  }

  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(basePayload, { onConflict: 'id' })

  if (upsertError) {
    console.error('[auth/callback] Failed to upsert profile:', upsertError.message)
    // Non-fatal — user is logged in, but worker may not have tokens.
    // Will surface as "no GA4 token" in reports.
  } else if (providerToken || providerRefreshToken) {
    console.log('[auth/callback] GA4 tokens saved for user', userId,
      providerRefreshToken ? '(with refresh_token)' : '(no refresh_token — re-login with prompt=consent needed)')
  }

  return NextResponse.redirect(`${origin}${next}`)
}
