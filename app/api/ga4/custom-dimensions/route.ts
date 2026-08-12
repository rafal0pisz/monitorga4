import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { resolvePropertyId } from '@/lib/ga4/resolveProperty'

// Lists the custom dimensions registered on a GA4 property, so the project
// settings form can validate a parameter name before saving it — a typo'd
// or unregistered parameter would otherwise silently fail every day in the
// worker run instead of being caught at config time.
export async function GET(request: NextRequest) {
  const resolved = await resolvePropertyId(request.nextUrl.searchParams)
  if ('error' in resolved) return resolved.error
  const { propertyId } = resolved

  const token = await getGa4Token()
  if (!token) {
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })
  }

  try {
    // Google defaults customDimensions.list to a 50-item page with no
    // pagination unless the caller asks for more — an account with 50+
    // registered custom dimensions would silently lose everything past the
    // first page, making genuinely-registered parameters look "not
    // available on this account" here even though data is flowing for them.
    // pageSize=200 (Google's max) plus a nextPageToken loop covers any size.
    const parameterNames: string[] = []
    let pageToken: string | undefined
    do {
      const url = new URL(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/customDimensions`)
      url.searchParams.set('pageSize', '200')
      if (pageToken) url.searchParams.set('pageToken', pageToken)
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Admin API ${res.status}: ${err.error?.message ?? res.statusText}`)
      }
      const data = await res.json()
      parameterNames.push(...(data.customDimensions ?? []).map((d: any) => d.parameterName as string))
      pageToken = data.nextPageToken
    } while (pageToken)
    return NextResponse.json({ parameterNames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
