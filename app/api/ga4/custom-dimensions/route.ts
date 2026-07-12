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
    const res = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${propertyId}/customDimensions`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Admin API ${res.status}: ${err.error?.message ?? res.statusText}`)
    }
    const data = await res.json()
    const parameterNames = (data.customDimensions ?? []).map((d: any) => d.parameterName as string)
    return NextResponse.json({ parameterNames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
