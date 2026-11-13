// Client-side concurrency limiter for /api/ga4/* calls. A single project
// page mounts several independent panels (LiveChecksPanel, two
// EventsDetailPanel instances, discover-events/custom-dimensions in the
// wizard/settings, and one ParameterCoveragePanel fetch PER declared
// parameter check — 50+ on a heavily-configured project) that each fire
// their own fetch on mount — combined, a single page load can send
// dozens of simultaneous requests against the SAME GA4 property. GA4
// responds to that burst by temporarily denying the property API access
// altogether ("GA4 429: this property is denied access to the API" or
// "Exhausted concurrent requests quota"), which no amount of per-request
// retry can fix. Routing every GA4 fetch through here caps how many are
// ever in flight at once, regardless of how many components independently
// trigger them.
//
// Kept at 1, not 2+: our own server (src/lib/ga4/report.ts) also caps
// concurrent Google calls per property, but only within a single
// serverless instance's memory — it can't see another instance handling a
// second request that landed elsewhere. Serializing to one in-flight
// request per tab means Vercel only ever needs one instance live for this
// property from this tab's traffic, so that per-instance cap is actually
// the real ceiling instead of being multiplied by however many instances
// happen to pick up simultaneous requests. The cost is a slower full page
// load on heavily-configured projects — acceptable; a working page that
// takes longer beats one that errors out on every panel.
const MAX_CONCURRENT = 1

let active = 0
const queue: (() => void)[] = []

function acquire(): Promise<void> {
  return new Promise(resolve => {
    if (active < MAX_CONCURRENT) {
      active++
      resolve()
      return
    }
    queue.push(() => { active++; resolve() })
  })
}

function release() {
  active--
  const next = queue.shift()
  if (next) next()
}

export async function ga4Fetch(input: string, init?: RequestInit): Promise<Response> {
  await acquire()
  try {
    return await fetch(input, init)
  } finally {
    release()
  }
}
