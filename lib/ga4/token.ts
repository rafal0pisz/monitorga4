import { createClient, createAdminClient } from '@/lib/supabase/server'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Refresh a Google OAuth access token using the stored refresh_token.
 * Throws on failure.
 */
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

  if (!res.ok) {
    throw new Error(
      `Google token refresh failed: ${data.error_description ?? data.error ?? res.status}`
    )
  }

  return data.access_token as string
}

/**
 * Get a valid GA4 access token.
 *
 * Resolution order:
 *  1. Current Supabase session → provider_token (fastest, no DB read)
 *  2. Stored access token in profiles, if not yet expired
 *  3. Refresh via stored refresh_token, then persist the new access token
 *
 * Returns null if no token can be obtained (user needs to re-login).
 */
export async function getGa4Token(): Promise<string | null> {
  // 1. Try the active session provider token first (available right after login)
  try {
    const sessionClient = await createClient()
    const { data: { session } } = await sessionClient.auth.getSession()
    if (session?.provider_token) {
      return session.provider_token
    }
  } catch {
    // No session context (e.g. called from worker/cron) — fall through
  }

  // 2 + 3. Fall back to profiles table
  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
    .eq('org_id', ORG_ID)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error || !profile) {
    console.warn('[getGa4Token] No profile found:', error?.message)
    return null
  }

  // No tokens at all
  if (!profile.ga4_access_token && !profile.ga4_refresh_token) {
    console.warn('[getGa4Token] No GA4 tokens in profile — user must log in again')
    return null
  }

  // 2. Stored access token still valid?
  if (profile.ga4_access_token && profile.ga4_token_expiry) {
    const expiry = new Date(profile.ga4_token_expiry)
    // 60s buffer to avoid using a token that expires mid-request
    if (expiry.getTime() - Date.now() > 60_000) {
      return profile.ga4_access_token
    }
  }

  // 3. Access token expired (or missing) — refresh it
  if (!profile.ga4_refresh_token) {
    console.warn('[getGa4Token] Access token expired and no refresh_token stored — user must re-login')
    return null
  }

  try {
    const newAccessToken = await refreshGoogleToken(profile.ga4_refresh_token)

    // Persist refreshed token
    await admin
      .from('profiles')
      .update({
        ga4_access_token: newAccessToken,
        ga4_token_expiry: new Date(Date.now() + 3500 * 1000).toISOString(),
      })
      .eq('org_id', ORG_ID)

    console.log('[getGa4Token] Token refreshed successfully')
    return newAccessToken
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[getGa4Token] Refresh failed:', msg)
    return null
  }
}
