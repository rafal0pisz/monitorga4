// Shared GA4 Data API `runReport` caller — every route used to define its
// own copy of this, each treating a 429 (rate limit) the same as any other
// error: a single thrown Error with no retry. At higher request volume a
// momentary quota hiccup would permanently fail whatever check or request
// triggered it, so this retries 429/5xx with exponential backoff before
// giving up.
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function ga4Report(propertyId: string, token: string, body: object): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) return res.json()

    const retryable = (res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES
    if (!retryable) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`GA4 ${res.status}: ${err.error?.message ?? res.statusText}`)
    }
    await sleep(BASE_DELAY_MS * 2 ** attempt)
  }
}
