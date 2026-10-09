import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

// Shared between /api/worker/run and /api/worker/watchdog — both need to
// accept Vercel Cron's bearer-token auth without a browser session.
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, and the length check itself leaks length — both are fine here
  // since the secret's length isn't the sensitive part, only its value.
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function isCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  return !!authHeader && safeCompare(authHeader, `Bearer ${cronSecret}`)
}
