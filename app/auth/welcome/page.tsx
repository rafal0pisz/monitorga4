'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { pushDataLayerEvent } from '@/lib/analytics/dataLayer'

// Only a same-origin relative path is ever honored — mirrors
// app/auth/callback/route.ts's own safeNextPath, re-checked here since this
// is a client page reading query params straight from the URL, which a
// crafted/bookmarked link could tamper with.
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function WelcomeRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const uid = searchParams.get('uid')
    const next = safeNextPath(searchParams.get('next'))
    if (uid) pushDataLayerEvent('sign_up', { user_id: uid })
    router.replace(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// A brief, one-time bridge page for first-ever logins only (see
// app/auth/callback/route.ts) — fires the sign_up analytics event with the
// new user's id, then forwards to the real destination. Nobody should
// linger here long enough to need more than a blank page.
export default function AuthWelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeRedirect />
    </Suspense>
  )
}
