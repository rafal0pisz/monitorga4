// Shared classifier for GA4 API errors that mean "the current Google
// authorization can't be used as-is" because the token was granted without
// the analytics.readonly scope. Both the Data API wrapper (ga4Report(), in
// report.ts — "GA4 403: Request had insufficient authentication scopes.")
// and the Admin API wrapper (listProperties.ts, and the raw fetch in
// custom-dimensions/route.ts — body contains "ACCESS_TOKEN_SCOPE_INSUFFICIENT")
// hit this, just with different wording. The fix is the same either way:
// sign in with Google again and grant the Analytics permission this time.
//
// Distinct from a 403 meaning "this specific Google account has no Viewer
// access to this GA4 property" (see memberAccess.ts's NO_GA4_ACCESS_MESSAGE)
// — that's a different problem with a different fix (ask the owner), not
// solved by reconnecting.
export function isGa4ReconnectError(message: string | undefined | null): boolean {
  if (!message) return false
  return /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(message)
}

export const GA4_RECONNECT_MESSAGE =
  "Your Google account is connected, but it didn't grant access to Google Analytics data. Sign in again and make sure to allow the Analytics permission on Google's consent screen."
