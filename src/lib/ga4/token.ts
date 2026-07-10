import { createAdminClient, createClient } from '@/lib/supabase/server'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

class TokenRefreshError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  let res: Response
  try {
    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    })
  } catch (err) {
    // Network-level failure (not Google rejecting the token) — one retry
    // is enough to ride out a transient blip without masking a real outage.
    await new Promise(resolve => setTimeout(resolve, 500))
    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    })
  }
  const data = await res.json()
  if (!res.ok) throw new TokenRefreshError(`Token refresh failed: ${data.error_description ?? data.error}`, data.error)
  return data.access_token
}

type TokenRow = {
  ga4_access_token: string | null
  ga4_refresh_token: string | null
  ga4_token_expiry: string | null
}

function isStillValid(row: TokenRow): boolean {
  if (!row.ga4_access_token) return false
  const expiry = row.ga4_token_expiry ? new Date(row.ga4_token_expiry) : new Date(0)
  // 60s buffer to avoid using a token that expires mid-request
  return expiry.getTime() - Date.now() > 60_000
}

async function refreshAndPersist(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const newToken = await refreshGoogleToken(refreshToken)
    await admin
      .from('profiles')
      .update({
        ga4_access_token: newToken,
        ga4_token_expiry: new Date(Date.now() + 3500 * 1000).toISOString(),
      })
      .eq('id', profileId)
    return newToken
  } catch (err) {
    console.error('[getGa4Token] refresh failed:', err instanceof Error ? err.message : err)
    if (err instanceof TokenRefreshError && err.code === 'invalid_grant') {
      // The refresh token itself has been revoked/expired — it will never
      // succeed on retry. Clear it so this profile correctly reads as "not
      // connected" instead of permanently holding a dead credential (which
      // previously caused getGa4Token to silently fall back to a different
      // account for this profile's projects — see below).
      await admin
        .from('profiles')
        .update({ ga4_access_token: null, ga4_refresh_token: null, ga4_token_expiry: null })
        .eq('id', profileId)
    }
    return null
  }
}

/**
 * Get a valid GA4 access token.
 *
 * Resolution order:
 *  1. If `ownerId` is given (worker/cron resolving a specific project's
 *     owner), that profile's own stored token — refreshed via their own
 *     refresh_token if expired. Each project must be checked with its
 *     owner's Google access, not a shared account, or the check can
 *     silently pass/fail against the wrong GA4 property permissions.
 *  2. Otherwise, the currently signed-in user's OWN stored token (matched by
 *     their user id), refreshed via their own refresh_token if expired.
 *  3. Falls back to the profile explicitly flagged `is_ga4_default` — used
 *     only when the owner/user has NEVER connected Google at all (no stored
 *     refresh token), or for unattended runs with no owner context. This is
 *     NOT "whichever account happened to log in first": an old throwaway/
 *     test login with access to only one property would silently produce a
 *     GA4 403 on every other property. The default account must be picked
 *     deliberately (see profiles.is_ga4_default).
 *
 *     Once an owner/user HAS a stored refresh token, resolution never falls
 *     through past it — success or failure resolves strictly to their own
 *     account. If Google rejects the refresh (`invalid_grant` — access was
 *     revoked or the token expired), the stored tokens are cleared so the
 *     profile correctly reads as "not connected" on the next check, and
 *     this call returns null instead of silently continuing to check that
 *     project with a different Google identity's permissions.
 *
 * Never uses the Supabase session's `provider_token` directly — Supabase
 * does not refresh that value after the initial OAuth exchange, so it goes
 * stale (~1h) while the app's own login session keeps looking active.
 *
 * Returns null if no token can be obtained (user needs to (re-)connect Google,
 * or nobody has been designated as the default GA4 account yet).
 */
export async function getGa4Token(ownerId?: string): Promise<string | null> {
  const admin = createAdminClient()

  if (ownerId) {
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
      .eq('id', ownerId)
      .maybeSingle()

    if (ownerProfile?.ga4_access_token && isStillValid(ownerProfile)) {
      return ownerProfile.ga4_access_token
    }
    if (ownerProfile?.ga4_refresh_token) {
      // This owner has (or had) their own Google connection — resolve
      // strictly to it, success or failure. Falling through to the org
      // default here would silently check this owner's project with a
      // different Google identity's permissions the moment their token
      // dies, instead of surfacing "reconnect Google" for this project.
      return refreshAndPersist(admin, ownerId, ownerProfile.ga4_refresh_token)
    }
  } else {
    try {
      const sessionClient = await createClient()
      const { data: { user } } = await sessionClient.auth.getUser()
      if (user) {
        const { data: ownProfile } = await admin
          .from('profiles')
          .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
          .eq('id', user.id)
          .maybeSingle()

        if (ownProfile?.ga4_access_token && isStillValid(ownProfile)) {
          return ownProfile.ga4_access_token
        }
        if (ownProfile?.ga4_refresh_token) {
          // Same reasoning as the ownerId branch above — don't swap this
          // signed-in user's request onto a different account's data.
          return refreshAndPersist(admin, user.id, ownProfile.ga4_refresh_token)
        }
      }
    } catch {
      // No session context (e.g. cron worker) — fall through to org default
    }
  }

  // No per-owner/per-user token available — fall back to the explicitly
  // designated default account for this org.
  const { data: profile } = await admin
    .from('profiles')
    .select('id, ga4_access_token, ga4_refresh_token, ga4_token_expiry')
    .eq('org_id', ORG_ID)
    .eq('is_ga4_default', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!profile) return null
  if (isStillValid(profile)) return profile.ga4_access_token
  if (profile.ga4_refresh_token) return refreshAndPersist(admin, profile.id, profile.ga4_refresh_token)

  return null
}
