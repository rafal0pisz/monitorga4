// Shared GA4 Data API `runReport` caller — every route used to define its
// own copy of this, each treating a 429 (rate limit) the same as any other
// error: a single thrown Error with no retry. At higher request volume a
// momentary quota hiccup would permanently fail whatever check or request
// triggered it, so this retries 429/5xx with exponential backoff before
// giving up.
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

// GA4's "concurrent requests" quota is enforced per property, and several
// callers fan out internally with no limit of their own (e.g. events/route.ts
// fires current+prev in parallel; parameters/route.ts can fire up to 3
// requests per period, x2 periods, per single parameter card). A project
// page mounting several of those panels at once — or the worker processing
// one property's checks — can burst past that quota even though no
// individual caller looks unreasonable. This caps how many requests are ever
// in flight for the SAME property at once, across every caller in this
// process; unrelated properties get their own queue and never wait on each
// other, so this never throttles throughput across different customers.
const MAX_CONCURRENT_PER_PROPERTY = 3

const propertyQueues = new Map<string, { active: number; queue: (() => void)[] }>()

function acquire(propertyId: string): Promise<void> {
  let state = propertyQueues.get(propertyId)
  if (!state) {
    state = { active: 0, queue: [] }
    propertyQueues.set(propertyId, state)
  }
  const s = state
  return new Promise(resolve => {
    if (s.active < MAX_CONCURRENT_PER_PROPERTY) {
      s.active++
      resolve()
      return
    }
    s.queue.push(() => { s.active++; resolve() })
  })
}

function release(propertyId: string) {
  const state = propertyQueues.get(propertyId)
  if (!state) return
  state.active--
  const next = state.queue.shift()
  if (next) next()
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function ga4Report(propertyId: string, token: string, body: object): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    await acquire(propertyId)
    let res: Response
    try {
      res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )
    } finally {
      // Released as soon as the request completes (or throws), not after
      // retry backoff — the queued slot represents an in-flight HTTP
      // request to Google, not this function's overall retry loop, so a
      // queued caller can start as soon as this attempt's connection is
      // done, while this attempt sleeps before its own next try.
      release(propertyId)
    }
    if (res.ok) return res.json()

    const retryable = (res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES
    if (!retryable) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`GA4 ${res.status}: ${err.error?.message ?? res.statusText}`)
    }
    await sleep(BASE_DELAY_MS * 2 ** attempt)
  }
}
