import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { fetchGA4Accounts, fetchGA4Properties } from '@/lib/ga4/listProperties'
import { isGa4ReconnectError, GA4_RECONNECT_MESSAGE } from '@/lib/ga4/errors'

export async function GET(request: NextRequest) {
  const token = await getGa4Token()

  if (!token) {
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })
  }

  try {
    const accounts = await fetchGA4Accounts(token)

    const results = await Promise.all(
      accounts.map(async (account: any) => {
        const properties = await fetchGA4Properties(token, account.name)
        return {
          accountName: account.name,
          accountDisplayName: account.displayName,
          properties: properties.map((p: any) => ({
            name: p.name,                    // "properties/123456789"
            displayName: p.displayName,
            propertyId: p.name.replace('properties/', ''),
          }))
        }
      })
    )

    return NextResponse.json({ accounts: results })
  } catch (err: any) {
    if (isGa4ReconnectError(err.message)) {
      return NextResponse.json({ error: GA4_RECONNECT_MESSAGE }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
