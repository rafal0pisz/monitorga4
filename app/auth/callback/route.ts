import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Only a same-origin relative path is ever honored — "next" rides through
// the OAuth round trip as a plain query param, so treating it as a trusted
// redirect target without this check would be an open redirect.
function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

// Appended to a /login redirect so a retry from there (bare "Kontynuuj
// przez Google" button) still ends up back at the original destination —
// previously an error here (or simply no code, e.g. the user cancelled
// Google's consent screen) sent them to a plain /login with no memory of
// where they'd been heading, which is exactly what made the invite-accept
// flow silently dead-end on any hiccup: one failed round trip and the
// person was back on /dashboard with no idea they still had to accept.
function loginRedirect(origin: string, error: string, next: string | null): string {
  return `${origin}/login?error=${error}${next ? `&next=${encodeURIComponent(next)}` : ''}`
}

const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

// Requesting a scope via signInWithOAuth doesn't guarantee Google actually
// granted it — a user can decline the specific "See your Google Analytics
// data" permission on Google's consent screen while still completing sign-
// in, landing on a session that authenticates fine but can't make a single
// GA4 API call. This is the one place that can catch that before it ever
// reaches a dashboard, by checking what the access token actually carries
// via Google's tokeninfo endpoint.
//
// Returns null (undetermined) rather than false when the check itself
// fails (tokeninfo unreachable, unexpected response shape) — a transient
// outage here must never block a legitimate login; only a definite "scope
// missing" answer should.
async function hasAnalyticsScope(accessToken: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`)
    if (!res.ok) return null
    const info = await res.json()
    if (typeof info.scope !== 'string') return null
    return info.scope.split(' ').includes(GA4_READONLY_SCOPE)
  } catch (err) {
    console.error('[auth/callback] tokeninfo check failed:', err)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (!code) {
    console.error('[auth/callback] Missing code param')
    return NextResponse.redirect(loginRedirect(origin, 'missing_code', next))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] Session exchange failed:', error?.message)
    return NextResponse.redirect(loginRedirect(origin, 'session_failed', next))
  }

  const { session } = data
  const providerToken        = session.provider_token         // access token (expires ~1h)
  const providerRefreshToken = session.provider_refresh_token // refresh token (long-lived)
  const userId               = session.user.id

  // Must-have check: analytics.readonly is a hard requirement for the app
  // to function at all (every check/report is a GA4 API call), so a login
  // that completed without it is treated as a failed login, not a degraded
  // one. Sign the user back out before redirecting — otherwise middleware's
  // own "/login with a session → bounce to /dashboard" rule would
  // immediately hide the error we're about to show.
  if (providerToken && (await hasAnalyticsScope(providerToken)) === false) {
    console.warn('[auth/callback] Google login succeeded but analytics.readonly was not granted for user', userId)
    await supabase.auth.signOut()
    return NextResponse.redirect(loginRedirect(origin, 'insufficient_scope', next))
  }

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

  return NextResponse.redirect(`${origin}${next ?? '/dashboard'}`)
}
