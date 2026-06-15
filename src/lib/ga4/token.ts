import { createClient, createAdminClient } from '@/lib/supabase/server'

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

/**
 * Get a valid GA4 access token.
 * Tries (in order):
 *   1. Current Supabase session provider_token
 *   2. Stored token in profiles table
 *   3. Refresh via refresh_token if expired
 * Returns null if no token available.
 */
export async function getGa4Token(): Promise<string | null> {
  // 1. Try current session
  try {
    const sessionClient = await createClient()
    const { data: { session } } = await sessionClient.auth.getSession()
    if (session?.provider_token) return session.provider_token
  } catch {}

  // 2. Try profiles table
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
    .eq('org_id', '00000000-0000-0000-0000-000000000001')
    .order('created_at')
    .limit(1)
    .single()

  if (!profile) return null

  // Check if stored token is still valid
  if (profile.ga4_access_token) {
    const expiry = profile.ga4_token_expiry ? new Date(profile.ga4_token_expiry) : new Date(0)
    if (expiry > new Date()) return profile.ga4_access_token
  }

  // 3. Refresh if we have a refresh token
  if (profile.ga4_refresh_token) {
    try {
      const newToken = await refreshGoogleToken(profile.ga4_refresh_token)
      await admin.from('profiles').update({
        ga4_access_token: newToken,
        ga4_token_expiry: new Date(Date.now() + 3500 * 1000).toISOString(),
      }).eq('org_id', '00000000-0000-0000-0000-000000000001')
      return newToken
    } catch {}
  }

  return null
}
