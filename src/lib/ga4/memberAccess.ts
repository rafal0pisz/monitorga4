import { getGa4Token } from './token'
import { listAccessiblePropertyIds } from './listProperties'

// Team membership (src/lib/team/access.ts) only grants AlertGA4-side
// visibility into the owner's projects — it says nothing about whether
// Google itself has actually granted this person access to a given GA4
// property. Seeing a shared project's real data requires the owner to
// have separately added the member's Google account as a Viewer (or
// higher) directly in GA4. This checks that, live, against the member's
// own token — never the owner's — so access can never be wider than what
// Google itself would allow this specific person to read.
//
// Fails closed throughout: no token, or the Admin API call failing, both
// resolve to "no access" rather than silently trusting team membership —
// the whole point of this check is that AlertGA4-side state is not
// sufficient on its own.
export async function getMemberAccessiblePropertyIds(memberId: string): Promise<Set<string>> {
  const token = await getGa4Token(memberId)
  if (!token) return new Set()
  return listAccessiblePropertyIds(token)
}

export async function memberHasAccessToProperty(memberId: string, propertyId: string): Promise<boolean> {
  const ids = await getMemberAccessiblePropertyIds(memberId)
  return ids.has(propertyId)
}

export const NO_GA4_ACCESS_MESSAGE =
  "You don't have your own Google Analytics access to this property yet — ask the project owner to add your Google account as a Viewer in GA4, then refresh."
