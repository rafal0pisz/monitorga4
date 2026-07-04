import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'

async function fetchGA4Accounts(token: string) {
  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`Accounts API ${res.status}`)
  const data = await res.json()
  return data.accounts ?? []
}

async function fetchGA4Properties(token: string, accountName: string) {
  const res = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/properties?filter=ancestor:${accountName}&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.properties ?? []
}

export async function GET(request: NextRequest) {
  const token = await getGa4Token()

  if (!token) {
    return NextResponse.json({ error: 'Brak tokena Google — zaloguj się ponownie' }, { status: 401 })
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
