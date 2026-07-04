import { createAdminClient, createClient } from '@/lib/supabase/server'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error_description ?? data.error}`)
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
  matchColumn: 'id' | 'org_id',
  matchValue: string,
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
      .eq(matchColumn, matchValue)
    return newToken
  } catch (err) {
    console.error('[getGa4Token] refresh failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Get a valid GA4 access token.
 *
 * Resolution order:
 *  1. The currently signed-in user's OWN stored token (matched by their user id),
 *     refreshed via their own refresh_token if expired. This matters because
 *     different team members may have Google accounts with different GA4
 *     property access — using someone else's stored token can produce a
 *     misleading 403 even though the signed-in user has access.
 *  2. Falls back to the org's oldest stored profile — used for unattended
 *     cron runs where there is no signed-in user/session at all.
 *
 * Never uses the Supabase session's `provider_token` directly — Supabase
 * does not refresh that value after the initial OAuth exchange, so it goes
 * stale (~1h) while the app's own login session keeps looking active.
 *
 * Returns null if no token can be obtained (user needs to (re-)connect Google).
 */
export async function getGa4Token(): Promise<string | null> {
  const admin = createAdminClient()

  try {
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (user) {
      const { data: ownProfile } = await admin
        .from('profiles')
        .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
        .eq('id', user.id)
        .single()

      if (ownProfile?.ga4_access_token && isStillValid(ownProfile)) {
        return ownProfile.ga4_access_token
      }
      if (ownProfile?.ga4_refresh_token) {
        const token = await refreshAndPersist(admin, 'id', user.id, ownProfile.ga4_refresh_token)
        if (token) return token
      }
    }
  } catch {
    // No session context (e.g. cron worker) — fall through to org default
  }

  // Unattended / no per-user token available — fall back to the org's default
  const { data: profile } = await admin
    .from('profiles')
    .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
    .eq('org_id', ORG_ID)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!profile) return null
  if (isStillValid(profile)) return profile.ga4_access_token
  if (profile.ga4_refresh_token) return refreshAndPersist(admin, 'org_id', ORG_ID, profile.ga4_refresh_token)

  return null
}
