import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

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

  // Save tokens to profiles table so the worker can refresh GA4 access
  // without requiring an active user session.
  if (providerToken || providerRefreshToken) {
    const admin = createAdminClient()

    const updatePayload: Record<string, string | null> = {
      ga4_access_token: providerToken ?? null,
      ga4_token_expiry: providerToken
        ? new Date(Date.now() + 3500 * 1000).toISOString() // ~58 min
        : null,
    }

    // Only overwrite refresh_token when Google issues a new one
    // (Google only sends it on first consent or when prompt=consent is used)
    if (providerRefreshToken) {
      updatePayload.ga4_refresh_token = providerRefreshToken
    }

    const { error: upsertError } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          org_id: '00000000-0000-0000-0000-000000000001',
          full_name: session.user.user_metadata?.full_name ?? null,
          ...updatePayload,
        },
        { onConflict: 'id' }
      )

    if (upsertError) {
      console.error('[auth/callback] Failed to save GA4 tokens:', upsertError.message)
      // Non-fatal — user is logged in, but worker may not have tokens.
      // Will surface as "no GA4 token" in reports.
    } else {
      console.log('[auth/callback] GA4 tokens saved for user', userId,
        providerRefreshToken ? '(with refresh_token)' : '(no refresh_token — re-login with prompt=consent needed)')
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
