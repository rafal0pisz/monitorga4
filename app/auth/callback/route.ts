import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Zapisz Google provider token do tabeli profiles
      // żeby worker mógł go pobrać bez kontekstu użytkownika
      const providerToken = data.session.provider_token
      const providerRefreshToken = data.session.provider_refresh_token
      const userId = data.session.user.id

      if (providerToken) {
        const admin = createAdminClient()
        await admin.from('profiles').upsert({
          id: userId,
          org_id: '00000000-0000-0000-0000-000000000001', // seed org Bettersteps
          full_name: data.session.user.user_metadata?.full_name ?? null,
          ga4_access_token: providerToken,
          ga4_refresh_token: providerRefreshToken ?? null,
          ga4_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // ~1h
        }, { onConflict: 'id' })
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
