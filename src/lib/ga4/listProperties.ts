// GA4 Admin API — "which accounts/properties can this token see". Shared
// by /api/ga4/properties (new-project wizard: browse your OWN account) and
// src/lib/ga4/memberAccess.ts (team feature: verify a member's OWN Google
// access to a specific shared property before showing them any of its
// data) — both need the same underlying accounts→properties walk.

export interface GA4AccountSummary { name: string; displayName: string }
export interface GA4PropertySummary { name: string; displayName: string } // name = "properties/123456789"

export async function fetchGA4Accounts(token: string): Promise<GA4AccountSummary[]> {
  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    // Google's actual error body (e.g. "Admin API has not been used in
    // project ... before or it is disabled") is the only way to tell a
    // disabled-API/permission problem apart from a token issue — losing it
    // and just throwing the status code makes this undiagnosable from the
    // client.
    const body = await res.text().catch(() => '')
    throw new Error(`Accounts API ${res.status}: ${body.slice(0, 500)}`)
  }
  const data = await res.json()
  return data.accounts ?? []
}

export async function fetchGA4Properties(token: string, accountName: string): Promise<GA4PropertySummary[]> {
  const res = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/properties?filter=ancestor:${accountName}&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.properties ?? []
}

// Every GA4 property id (e.g. "properties/123456789" — matches how
// projects.ga4_property_id is stored) this token has at least Viewer
// access to, across every GA4 account it can see. Fails closed (empty
// set) on any Admin API error rather than throwing — callers use this to
// decide what a person is allowed to see, and a transient API hiccup must
// never read as "has access to everything".
export async function listAccessiblePropertyIds(token: string): Promise<Set<string>> {
  try {
    const accounts = await fetchGA4Accounts(token)
    const ids = new Set<string>()
    await Promise.all(accounts.map(async account => {
      const properties = await fetchGA4Properties(token, account.name)
      for (const p of properties) ids.add(p.name)
    }))
    return ids
  } catch (e) {
    console.error('[listProperties] Could not list accessible GA4 properties:', e instanceof Error ? e.message : e)
    return new Set()
  }
}
