// Client-side concurrency limiter for /api/ga4/* calls. A single project
// page mounts several independent panels (LiveChecksPanel, two
// EventsDetailPanel instances, discover-events/custom-dimensions in the
// wizard/settings) that each fire their own fetch on mount — combined,
// a single page load can send 10+ simultaneous requests against the SAME
// GA4 property. GA4 responds to that burst by temporarily denying the
// property API access altogether ("GA4 429: this property is denied
// access to the API"), which no amount of per-request retry can fix.
// Routing every GA4 fetch through here caps how many are ever in flight
// at once, regardless of how many components independently trigger them.
const MAX_CONCURRENT = 2

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
