import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report } from '@/lib/ga4/report'
import { GA4_STANDARD_PARAMS, GA4_STANDARD_METRICS } from '@/lib/ga4/standardParams'
import { sendEmail } from '@/lib/email/resend'
import { renderOwnerDigestEmail, type DigestEntry } from '@/lib/email/ownerDigest'
import { renderClientAlertEmail } from '@/lib/email/clientAlert'
import { renderReconnectNoticeEmail } from '@/lib/email/reconnectNotice'
import type { Project, CheckResult } from '@/types'

// Default serverless timeout is far too short once this loops over dozens
// of projects sequentially (each doing ~a dozen GA4 calls) — 300s is the
// Vercel Pro plan ceiling; raise further (Enterprise: up to 900s) or lower
// to 60s (Hobby ceiling) to match your actual plan.
export const maxDuration = 300

// ============================================================
// Autoryzacja
// ============================================================
// Ten endpoint musi być wywoływalny bez sesji przeglądarki (Vercel Cron —
// codzienny automatyczny run) ORAZ z sesją (klik "Run now" z UI). Middleware
// przepuszcza ten path bez przekierowania na /login, więc autoryzację
// sprawdzamy tutaj: albo poprawny sekret crona, albo zalogowany użytkownik.
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, and the length check itself leaks length — both are fine here
  // since the secret's length isn't the sensitive part, only its value.
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function isCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  return !!authHeader && safeCompare(authHeader, `Bearer ${cronSecret}`)
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (isCronRequest(request)) return true

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

// ============================================================
// Wagi checków
// ============================================================
const WEIGHTS: Record<string, number> = {
  expected_events:      15,
  purchase_duplicates:  12,
  ecommerce_events:     10,
  self_referral:        10,
  direct_traffic_spike:  8,
  bounce_rate_anomaly:   8,
  conversion_rate:      10,
  page_title_null:       8,
  bot_traffic_night:    12,
  geo_anomaly:           7,
  session_no_events:    10,
  parameter_checks:      8,
}

// ============================================================
// GA4 Data API helper
// ============================================================
// ============================================================
// Zakresy dat WoW
// ============================================================
function getWoWRanges() {
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const today = new Date()

  const endC = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - 6)
  const endP = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - 6)

  return {
    current: { startDate: fmt(startC), endDate: fmt(endC), name: 'current' },
    prev:    { startDate: fmt(startP), endDate: fmt(endP), name: 'prev' },
  }
}


// ============================================================
// 8 CORE CHECKÓW
// ============================================================

// ============================================================
// Parameter coverage check
// ============================================================

// Item-scoped dimensions (product-level ecommerce fields) can't be combined
// with the event-scoped `eventCount` metric — GA4 Data API rejects it
// ("Please remove eventCount to make the request compatible"). Each needs
// the item-scoped metric that matches the event it's reported against.
const ITEM_SCOPED_DIMENSIONS = new Set(['itemId', 'itemName', 'itemBrand', 'itemCategory', 'itemVariant'])
const ITEM_METRIC_BY_EVENT: Record<string, string> = {
  view_item_list:    'itemListViewEvents',
  select_item:       'itemsClickedInList',
  view_item:         'itemsViewed',
  add_to_cart:       'itemsAddedToCart',
  begin_checkout:    'itemsCheckedOut',
  add_shipping_info: 'itemsCheckedOut',
  add_payment_info:  'itemsCheckedOut',
  purchase:          'itemsPurchased',
  view_promotion:    'itemListViewEvents',
  select_promotion:  'itemsClickedInPromotion',
}

async function checkParameters(
  project: { ga4_property_id: string },
  token: string,
  paramChecks: { event_name: string; parameter_name: string }[],
  ranges: { current: { startDate: string; endDate: string }; prev: { startDate: string; endDate: string } }
): Promise<CheckResult[]> {
  if (!paramChecks.length) return []
  // Cały check_key "parameter_checks" ma stały budżet wagowy niezależnie od
  // liczby skonfigurowanych par event/parametr — analogicznie do custom
  // events, żeby ta kategoria nie rosła bez ograniczeń wraz z liczbą
  // sprawdzanych parametrów.
  const w = +((WEIGHTS['parameter_checks'] ?? 8) / paramChecks.length).toFixed(2)
  const results: CheckResult[] = []

  const rangeC = ranges.current
  const rangeP = ranges.prev

  for (const pc of paramChecks) {
    const { event_name, parameter_name } = pc
    const checkKey = `param_${event_name}_${parameter_name}`
    try {
      const getCoverage = async (dateRange: object): Promise<number> => {
        // Resolve correct GA4 API name: custom dim, standard dim, or standard metric
        const stdDim    = GA4_STANDARD_PARAMS[parameter_name]
        const stdMetric = GA4_STANDARD_METRICS[parameter_name]
        const dimName   = stdDim ?? `customEvent:${parameter_name}`

        if (stdMetric) {
          // For value/price etc — check if metric > 0 (presence, not coverage)
          const data = await ga4Report(project.ga4_property_id, token, {
            dateRanges: [dateRange],
            metrics:    [{ name: stdMetric }],
            dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: event_name } } },
          })
          const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value ?? '0')
          return val > 0 ? 100 : 0
        }

        if (stdDim && ITEM_SCOPED_DIMENSIONS.has(stdDim)) {
          const itemMetric = ITEM_METRIC_BY_EVENT[event_name]
          if (!itemMetric) {
            throw new Error(`Coverage check not supported for item-scoped parameter "${parameter_name}" on event "${event_name}"`)
          }
          // No eventName filter here — the item metric is already specific
          // to that event (e.g. itemsAddedToCart only counts add_to_cart).
          const data = await ga4Report(project.ga4_property_id, token, {
            dateRanges: [dateRange],
            dimensions: [{ name: stdDim }],
            metrics:    [{ name: itemMetric }],
            limit: 100,
          })
          const rows = data.rows ?? []
          const total     = rows.reduce((s: number, r: any) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0)
          const withParam = rows
            .filter((r: any) => r.dimensionValues?.[0]?.value !== '(not set)' && r.dimensionValues?.[0]?.value !== '')
            .reduce((s: number, r: any) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0)
          return total > 0 ? (withParam / total) * 100 : 0
        }

        const data = await ga4Report(project.ga4_property_id, token, {
          dateRanges: [dateRange],
          dimensions: [{ name: dimName }],
          metrics:    [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: event_name } } },
          limit: 100,
        })
        const rows = data.rows ?? []
        const total     = rows.reduce((s: number, r: any) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0)
        const withParam = rows
          .filter((r: any) => r.dimensionValues?.[0]?.value !== '(not set)' && r.dimensionValues?.[0]?.value !== '')
          .reduce((s: number, r: any) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0)
        return total > 0 ? (withParam / total) * 100 : 0
      }

      const [covC, covP] = await Promise.all([getCoverage(rangeC), getCoverage(rangeP)])
      const delta  = +(covC - covP).toFixed(1)
      const status = covC >= 90 ? 'pass' : covC >= 70 ? 'warn' : 'fail'
      const score  = status === 'pass' ? w : status === 'warn' ? Math.round(w * 0.5) : 0

      results.push({
        check_key: checkKey, check_level: 'optional', status, score, weight: w,
        value:   { coverage_current: +covC.toFixed(1), coverage_prev: +covP.toFixed(1), delta },
        message: `${event_name}.${parameter_name}: ${covC.toFixed(1)}% coverage (${delta >= 0 ? '+' : ''}${delta}pp WoW)`,
      })
    } catch (e: any) {
      results.push({
        check_key: checkKey, check_level: 'optional', status: 'fail', score: 0, weight: w,
        value: { error: e.message }, message: `${event_name}.${parameter_name}: check error`,
      })
    }
  }
  return results
}

async function runAllChecks(project: Project, token: string, ecomEvents: string[] = [], customEventChecks: {event_name: string; check_type: string}[] = []): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const ranges = getWoWRanges()
  const pid = project.ga4_property_id

  // ── 1. EXPECTED EVENTS ──────────────────────────────────
  {
    const w = WEIGHTS.expected_events
    const expected = project.expected_events ?? []
    if (expected.length === 0) {
      results.push({ check_key: 'expected_events', check_level: 'core', status: 'pass', score: w, weight: w, value: {}, message: 'No expected events configured — check skipped' })
    } else {
      try {
        const r = await ga4Report(pid, token, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: { values: expected }
            }
          }
        })
        const found = new Set<string>((r.rows ?? []).map((row: any) => row.dimensionValues?.[0]?.value))
        const missing = expected.filter(e => !found.has(e))
        const status = missing.length === 0 ? 'pass' : missing.length === 1 ? 'warn' : 'fail'
        const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
        results.push({
          check_key: 'expected_events', check_level: 'core', status, score, weight: w,
          value: { missing, found: [...found] },
          message: missing.length === 0 ? 'All expected events present' : `Missing events: ${missing.join(', ')}`,
        })
      } catch (e: any) {
        results.push({ check_key: 'expected_events', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
      }
    }
  }

  // ── 2. SELF-REFERRAL ─────────────────────────────────────
  {
    const w = WEIGHTS.self_referral
    if (!project.own_domain) {
      results.push({ check_key: 'self_referral', check_level: 'core', status: 'pass', score: w, weight: w, value: {}, message: 'No domain configured — check skipped' })
    } else {
      try {
        const r = await ga4Report(pid, token, {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 50,
        })
        const rows = r.rows ?? []
        const total = rows.reduce((s: number, row: any) => s + parseInt(row.metricValues?.[0]?.value ?? '0'), 0)
        const selfSessions = rows
          .filter((row: any) => row.dimensionValues?.[0]?.value?.includes(project.own_domain!))
          .reduce((s: number, row: any) => s + parseInt(row.metricValues?.[0]?.value ?? '0'), 0)
        const ratio = total > 0 ? selfSessions / total : 0
        const status = ratio === 0 ? 'pass' : ratio < 0.02 ? 'warn' : 'fail'
        const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
        results.push({
          check_key: 'self_referral', check_level: 'core', status, score, weight: w,
          value: { ratio: +(ratio * 100).toFixed(2), self_sessions: selfSessions, total },
          message: ratio === 0 ? 'No self-referrals' : `Self-referral: ${(ratio * 100).toFixed(2)}% of sessions`,
        })
      } catch (e: any) {
        results.push({ check_key: 'self_referral', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
      }
    }
  }

  // ── 3. BOUNCE RATE ANOMALY (WoW) ─────────────────────────
  {
    const w = WEIGHTS.bounce_rate_anomaly
    try {
      // Dwa osobne requesty — GA4 nie pozwala używać dateRange jako wymiaru
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], metrics: [{ name: 'bounceRate' }] }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    metrics: [{ name: 'bounceRate' }] }),
      ])
      const curr = parseFloat(rC.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const prev = parseFloat(rP.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const delta = prev > 0 ? ((curr - prev) / prev) * 100 : 0
      const absDelta = Math.abs(delta)
      const status = absDelta <= 20 ? 'pass' : absDelta <= 35 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'bounce_rate_anomaly', check_level: 'core', status, score, weight: w,
        value: { current: +(curr * 100).toFixed(1), prev: +(prev * 100).toFixed(1), delta: +delta.toFixed(1) },
        message: `Bounce rate: ${(curr * 100).toFixed(1)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
      })
    } catch (e: any) {
      results.push({ check_key: 'bounce_rate_anomaly', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── 4. DIRECT TRAFFIC SPIKE (WoW) ────────────────────────
  {
    const w = WEIGHTS.direct_traffic_spike
    try {
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], dimensions: [{ name: 'sessionMedium' }], metrics: [{ name: 'sessions' }] }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    dimensions: [{ name: 'sessionMedium' }], metrics: [{ name: 'sessions' }] }),
      ])
      const sumRows = (rows: any[]) => rows.reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const directRows = (rows: any[]) => rows.filter((r: any) => r.dimensionValues?.[0]?.value === '(none)')
      const totalC  = sumRows(rC.rows ?? [])
      const directC = sumRows(directRows(rC.rows ?? []))
      const totalP  = sumRows(rP.rows ?? [])
      const directP = sumRows(directRows(rP.rows ?? []))
      const ratioC = totalC > 0 ? directC / totalC : 0
      const ratioP = totalP > 0 ? directP / totalP : 0
      const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
      const status = delta <= 15 ? 'pass' : delta <= 30 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'direct_traffic_spike', check_level: 'core', status, score, weight: w,
        value: { direct_ratio_current: +(ratioC * 100).toFixed(1), direct_ratio_prev: +(ratioP * 100).toFixed(1), delta: +delta.toFixed(1) },
        message: `Direct traffic: ${(ratioC * 100).toFixed(1)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
      })
    } catch (e: any) {
      results.push({ check_key: 'direct_traffic_spike', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── 5. CONVERSION RATE (WoW) ─────────────────────────────
  {
    const w = WEIGHTS.conversion_rate
    try {
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], metrics: [{ name: 'sessions' }, { name: 'conversions' }] }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    metrics: [{ name: 'sessions' }, { name: 'conversions' }] }),
      ])
      const sessC = parseInt(rC.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const convC = parseInt(rC.rows?.[0]?.metricValues?.[1]?.value ?? '0')
      const sessP = parseInt(rP.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const convP = parseInt(rP.rows?.[0]?.metricValues?.[1]?.value ?? '0')
      const crC = sessC > 0 ? convC / sessC : 0
      const crP = sessP > 0 ? convP / sessP : 0
      const delta = crP > 0 ? ((crC - crP) / crP) * 100 : 0
      const absDelta = Math.abs(delta)
      const status = absDelta <= 25 ? 'pass' : absDelta <= 40 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'conversion_rate', check_level: 'core', status, score, weight: w,
        value: { cr_current: +(crC * 100).toFixed(2), cr_prev: +(crP * 100).toFixed(2), delta: +delta.toFixed(1) },
        message: `CR: ${(crC * 100).toFixed(2)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
      })
    } catch (e: any) {
      results.push({ check_key: 'conversion_rate', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── 6. PAGE_TITLE NULL RATE ──────────────────────────────
  {
    const w = WEIGHTS.page_title_null
    try {
      const r = await ga4Report(pid, token, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'sessions' }],
        limit: 100,
      })
      const rows = r.rows ?? []
      const total = rows.reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const nullSessions = rows
        .filter((r: any) => !r.dimensionValues?.[0]?.value || r.dimensionValues?.[0]?.value === '(not set)')
        .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const ratio = total > 0 ? nullSessions / total : 0
      const status = ratio < 0.02 ? 'pass' : ratio < 0.10 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'page_title_null', check_level: 'core', status, score, weight: w,
        value: { null_rate: +(ratio * 100).toFixed(2), null_sessions: nullSessions, total },
        message: `page_title null rate: ${(ratio * 100).toFixed(2)}%`,
      })
    } catch (e: any) {
      results.push({ check_key: 'page_title_null', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── 7. BOT TRAFFIC — NIGHT SPIKE (WoW) ───────────────────
  {
    const w = WEIGHTS.bot_traffic_night
    try {
      // Dwa osobne requesty — GA4 nie pozwala używać dateRange jako wymiaru
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], dimensions: [{ name: 'hour' }], metrics: [{ name: 'sessions' }] }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    dimensions: [{ name: 'hour' }], metrics: [{ name: 'sessions' }] }),
      ])
      const nightHours = ['0','1','2','3','4','5']
      const sumNight = (rows: any[]) => rows
        .filter((r: any) => nightHours.includes(r.dimensionValues?.[0]?.value))
        .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const sumTotal = (rows: any[]) => rows
        .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const rowsC = rC.rows ?? []
      const rowsP = rP.rows ?? []
      const nightC = sumNight(rowsC); const totalC = sumTotal(rowsC)
      const nightP = sumNight(rowsP); const totalP = sumTotal(rowsP)
      const ratioC = totalC > 0 ? nightC / totalC : 0
      const ratioP = totalP > 0 ? nightP / totalP : 0
      const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
      const status = delta <= 50 ? 'pass' : delta <= 100 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'bot_traffic_night', check_level: 'core', status, score, weight: w,
        value: { night_ratio_current: +(ratioC * 100).toFixed(1), night_ratio_prev: +(ratioP * 100).toFixed(1), delta: +delta.toFixed(1) },
        message: `Night traffic (0–5h): ${(ratioC * 100).toFixed(1)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
      })
    } catch (e: any) {
      results.push({ check_key: 'bot_traffic_night', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── 8. PURCHASE DUPLICATES (WoW) ─────────────────────────
  {
    const w = WEIGHTS.purchase_duplicates
    try {
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], metrics: [{ name: 'sessions' }, { name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'purchase' } } } }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    metrics: [{ name: 'sessions' }, { name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'purchase' } } } }),
      ])
      const sessC = parseInt(rC.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const evC   = parseInt(rC.rows?.[0]?.metricValues?.[1]?.value ?? '0')
      const sessP = parseInt(rP.rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const evP   = parseInt(rP.rows?.[0]?.metricValues?.[1]?.value ?? '0')
      const ratioC = sessC > 0 ? evC / sessC : 0
      const ratioP = sessP > 0 ? evP / sessP : 0
      const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
      const status = delta <= 10 ? 'pass' : delta <= 30 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'purchase_duplicates', check_level: 'core', status, score, weight: w,
        value: { ratio_current: +ratioC.toFixed(3), ratio_prev: +ratioP.toFixed(3), delta: +delta.toFixed(1) },
        message: evC === 0 ? 'No purchase events in this period' : `Purchase/session ratio: ${ratioC.toFixed(3)} (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
      })
    } catch (e: any) {
      results.push({ check_key: 'purchase_duplicates', check_level: 'core', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── OPTIONAL: GEO ANOMALY ─────────────────────────────────
  {
    const w = WEIGHTS.geo_anomaly
    try {
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, { dateRanges: [ranges.current], dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], limit: 5, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
        ga4Report(pid, token, { dateRanges: [ranges.prev],    dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], limit: 5, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
      ])
      const top5C = new Set<string>((rC.rows ?? []).map((r: any) => r.dimensionValues?.[0]?.value))
      const top5P = new Set<string>((rP.rows ?? []).map((r: any) => r.dimensionValues?.[0]?.value))
      const newCountries = [...top5C].filter(c => !top5P.has(c))
      const status = newCountries.length === 0 ? 'pass' : newCountries.length === 1 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'geo_anomaly', check_level: 'optional', status, score, weight: w,
        value: { top5_current: [...top5C], top5_prev: [...top5P], new_countries: newCountries },
        message: newCountries.length === 0 ? 'Top 5 countries unchanged' : `New countries in Top 5: ${newCountries.join(', ')}`,
      })
    } catch (e: any) {
      results.push({ check_key: 'geo_anomaly', check_level: 'optional', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── OPTIONAL: SESSION WITHOUT EVENTS ─────────────────────
  {
    const w = WEIGHTS.session_no_events
    try {
      const r = await ga4Report(pid, token, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
      })
      // Proxy: używamy engagementRate — sesje bez zaangażowania ≈ sesje bez eventów
      const rows = r.rows ?? []
      const total = parseInt(rows?.[0]?.metricValues?.[0]?.value ?? '0')
      const bounceRate = parseFloat(rows?.[0]?.metricValues?.[1]?.value ?? '0')
      const emptyEstimate = Math.round(total * bounceRate)
      const ratio = total > 0 ? emptyEstimate / total : 0
      const status = ratio < 0.05 ? 'pass' : ratio < 0.15 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'session_no_events', check_level: 'optional', status, score, weight: w,
        value: { estimated_empty: emptyEstimate, total_sessions: total, ratio: +(ratio * 100).toFixed(1) },
        message: `Estimated sessions without engagement: ${(ratio * 100).toFixed(1)}%`,
      })
    } catch (e: any) {
      results.push({ check_key: 'session_no_events', check_level: 'optional', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── CUSTOM EVENTS: configured event checks ───────────────────
  if (customEventChecks.length > 0) {
    try {
      const eventNames = customEventChecks.map(e => e.event_name)
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, {
          dateRanges: [ranges.current],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: eventNames } } },
        }),
        ga4Report(pid, token, {
          dateRanges: [ranges.prev],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: eventNames } } },
        }),
      ])
      const countC: Record<string, number> = {}
      const countP: Record<string, number> = {}
      for (const row of rC.rows ?? []) countC[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value ?? '0')
      for (const row of rP.rows ?? []) countP[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value ?? '0')

      const missing = eventNames.filter(ev => !countC[ev])
      const drops: string[] = []
      for (const ev of eventNames) {
        if (countC[ev] && countP[ev]) {
          const delta = (countC[ev] - countP[ev]) / countP[ev]
          if (delta < -0.5) drops.push(ev)
        }
      }
      // Per-event results — one card per custom event
      const wPerEv = +(8 / Math.max(eventNames.length, 1)).toFixed(2)
      for (const ev of eventNames) {
        const currCount = countC[ev] ?? 0
        const prevCount = countP[ev] ?? 0
        const pctDelta  = prevCount > 0 ? ((currCount - prevCount) / prevCount) * 100 : 0
        const evStatus  = currCount === 0 ? 'fail' : Math.abs(pctDelta) > 50 ? 'warn' : 'pass'
        const evScore   = evStatus === 'pass' ? wPerEv : evStatus === 'warn' ? wPerEv * 0.5 : 0
        results.push({
          check_key: `custom_event_${ev}`, check_level: 'core',
          status: evStatus, score: evScore, weight: wPerEv,
          value: { current: currCount, prev: prevCount, delta: +pctDelta.toFixed(1) },
          message: currCount === 0
            ? `No ${ev} events in current period`
            : `${currCount.toLocaleString()} events (WoW: ${pctDelta > 0 ? '+' : ''}${pctDelta.toFixed(1)}%)`,
        })
      }
    } catch (e: any) {
      results.push({ check_key: 'custom_events_check', check_level: 'core', status: 'fail', score: 0, weight: 8, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

    // ── ECOMMERCE: configured events volume check ───────────────
  if (ecomEvents.length > 0) {
    try {
      const [rC, rP] = await Promise.all([
        ga4Report(pid, token, {
          dateRanges: [ranges.current],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ecomEvents } } },
        }),
        ga4Report(pid, token, {
          dateRanges: [ranges.prev],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ecomEvents } } },
        }),
      ])
      const countC: Record<string, number> = {}
      const countP: Record<string, number> = {}
      for (const row of rC.rows ?? []) countC[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value ?? '0')
      for (const row of rP.rows ?? []) countP[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value ?? '0')

      const missing = ecomEvents.filter(ev => !countC[ev])
      const drops: string[] = []
      for (const ev of ecomEvents) {
        if (countC[ev] && countP[ev]) {
          const delta = (countC[ev] - countP[ev]) / countP[ev]
          if (delta < -0.5) drops.push(ev)
        }
      }

      const status = missing.length > 0 ? 'fail' : drops.length > 0 ? 'warn' : 'pass'
      const w = 10
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'ecommerce_events', check_level: 'core', status, score, weight: w,
        value: { configured: ecomEvents, current: countC, prev: countP, missing, drops },
        message: missing.length > 0
          ? `Missing ecommerce events: ${missing.join(', ')}`
          : drops.length > 0
          ? `Ecommerce volume drop >50%: ${drops.join(', ')}`
          : `All ${ecomEvents.length} ecommerce events present`,
      })
    } catch (e: any) {
      results.push({ check_key: 'ecommerce_events', check_level: 'core', status: 'fail', score: 0, weight: 10, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  return results
}

// ============================================================
// Concurrency-limited project processing
// ============================================================
// Projects used to be processed one at a time in a plain for-loop — each
// project's full pipeline (~20+ sequential GA4 calls) had to finish before
// the next one started. At dozens of projects that easily runs past any
// serverless maxDuration. This keeps WORKER_CONCURRENCY projects in flight
// at once instead, pulling the next one as soon as a slot frees up.
const WORKER_CONCURRENCY = 8

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

interface ProjectRunOutcome {
  projectId: string
  processed: boolean
  errorMessage?: string
  digestEntry: DigestEntry
}

// One project's full check pipeline — extracted from the worker loop so it
// can run concurrently across projects instead of every project waiting on
// the one before it.
async function processProject(
  supabase: ReturnType<typeof createAdminClient>,
  project: Project,
  runDate: string,
  prevDate: string,
  isAutoRunPass: boolean
): Promise<ProjectRunOutcome | null> {
  // Token z profiles (DB-backed access token + refresh_token), rozwiązywany
  // per-projekt na podstawie jego właściciela — każdy projekt może
  // należeć do innego konta Google z dostępem do innych property, więc
  // wspólny token dla całego batcha dawałby błędne 403 dla cudzych
  // projektów. Gdy właściciel nie ma tokenu (np. manualny run bez sesji
  // i bez owner_id), spada na domyślne konto organizacji.
  // Nie używamy session.provider_token — Supabase nie odświeża tego pola
  // po wymianie kodu OAuth, więc po ~1h staje się nieaktualne mimo że
  // sesja logowania w aplikacji wciąż wygląda jako aktywna.
  const accessToken = await getGa4Token(project.owner_id ?? undefined)

  if (!accessToken) {
    const errorMessage = 'No GA4 token — owner needs to sign in with Google'
    await supabase.from('dqs_runs').upsert({
      project_id: project.id,
      run_date: runDate,
      status: 'failed',
      score_total: null,
      error_message: errorMessage,
    }, { onConflict: 'project_id,run_date' })

    // Only the unattended auto_run pass silently fails without anyone
    // watching — a manual "Run now" failure is already visible to whoever
    // clicked it. Notify the owner directly (not project.alert_email, which
    // may be a client stakeholder who can't reconnect anything) so a dead
    // connection doesn't go unnoticed indefinitely. Deduped against
    // yesterday's stored error so this fires once, not every day.
    if (isAutoRunPass && project.owner_id) {
      const { data: prevRunRow } = await supabase
        .from('dqs_runs').select('error_message')
        .eq('project_id', project.id).eq('run_date', prevDate).maybeSingle()
      const alreadyNotified = prevRunRow?.error_message === errorMessage
      if (!alreadyNotified) {
        const { data: ownerUser } = await supabase.auth.admin.getUserById(project.owner_id)
        if (ownerUser?.user?.email) {
          await sendEmail({ to: ownerUser.user.email, ...renderReconnectNoticeEmail(project.name) })
        }
      }
    }

    return {
      projectId: project.id,
      processed: false,
      errorMessage,
      digestEntry: {
        projectId: project.id,
        name: project.name,
        runStatus: 'failed',
        errorMessage,
        checkErrors: [],
        scoreTotal: null,
        prevScore: null,
        topSignal: '',
        belowThreshold: true,
        alertThreshold: project.alert_threshold,
      },
    }
  }

  // Create / update run
  const { data: run } = await supabase.from('dqs_runs').upsert({
    project_id: project.id,
    run_date: runDate,
    status: 'running',
    score_total: null,
    error_message: null,
  }, { onConflict: 'project_id,run_date' }).select().single()

  if (!run) return null

  try {
    // Check if we already have a better score today — skip if so
    const { data: existingRun } = await supabase
      .from('dqs_runs')
      .select('id, score_total')
      .eq('project_id', project.id)
      .eq('run_date', runDate)
      .eq('status', 'completed')
      .single()

    // Fetch ecommerce + custom events via RPC (bypasses schema cache)
    const [{ data: ecomRaw }, { data: customRaw }, { data: paramRaw }] = await Promise.all([
      supabase.rpc('get_ecommerce_config', { p_project_id: project.id }),
      supabase.rpc('get_custom_event_checks', { p_project_id: project.id }),
      supabase.rpc('get_parameter_checks',    { p_project_id: project.id }),
    ])
    const ecomArr = Array.isArray(ecomRaw) ? ecomRaw : (typeof ecomRaw === 'string' ? JSON.parse(ecomRaw) : [])
    const ecomEvents = ecomArr.filter((e: any) => e.is_enabled).map((e: any) => e.event_name as string)
    const customArr = Array.isArray(customRaw) ? customRaw : (typeof customRaw === 'string' ? JSON.parse(customRaw) : [])
    const customEventChecks = customArr.filter((e: any) => e.is_enabled !== false)
    const paramArr    = Array.isArray(paramRaw) ? paramRaw : (typeof paramRaw === 'string' ? JSON.parse(paramRaw) : [])
    const paramChecks = paramArr.map((p: any) => ({ event_name: p.event_name, parameter_name: p.parameter_name }))

    const [results, paramResults] = await Promise.all([
      runAllChecks(project, accessToken, ecomEvents, customEventChecks),
      checkParameters(project, accessToken, paramChecks, (() => {
        const _today = new Date()
        const _fmt = (d: Date) => d.toISOString().split('T')[0]
        const _endC = new Date(_today); _endC.setDate(_today.getDate() - 1)
        const _startC = new Date(_endC); _startC.setDate(_endC.getDate() - 6)
        const _endP = new Date(_startC); _endP.setDate(_startC.getDate() - 1)
        const _startP = new Date(_endP); _startP.setDate(_endP.getDate() - 6)
        return { current: { startDate: _fmt(_startC), endDate: _fmt(_endC) }, prev: { startDate: _fmt(_startP), endDate: _fmt(_endP) } }
      })()),
    ])
    const allResults = [...results, ...paramResults]
    // Normalizacja do rzeczywistej sumy wag checków, które się wykonały
    // w tym przebiegu — 10 zawsze aktywnych checków sumuje się do 100,
    // ale Ecommerce/Custom events/Parameter checks są doliczane tylko
    // gdy dany projekt ma je skonfigurowane, więc "100%" musi być liczone
    // względem tego, co faktycznie brało udział w tym przebiegu, a nie
    // względem sztywnej sumy — inaczej wynik przekraczałby 100.
    const totalWeight = allResults.reduce((s, r) => s + r.weight, 0)
    const rawScore = allResults.reduce((s, r) => s + r.score, 0)
    const scoreTotal = totalWeight > 0 ? +((rawScore / totalWeight) * 100).toFixed(2) : 0

    // Keep best score of the day
    const isBetter = !existingRun || scoreTotal >= (existingRun.score_total ?? 0)
    const finalScore = isBetter ? scoreTotal : (existingRun!.score_total ?? scoreTotal)
    if (isBetter) {
      await supabase.from('dqs_results').delete().eq('run_id', run.id)
      await supabase.from('dqs_results').insert(allResults.map(r => ({ ...r, run_id: run.id })))
      await supabase.from('dqs_runs').update({ status: 'completed', score_total: scoreTotal }).eq('id', run.id)
    } else {
      // Score not better — mark run as completed but keep old results
      await supabase.from('dqs_runs').update({ status: 'completed', score_total: existingRun!.score_total }).eq('id', run.id)
    }

    // Yesterday's score, for the WoW delta shown in both email types
    const { data: prevRun } = await supabase
      .from('dqs_runs')
      .select('score_total')
      .eq('project_id', project.id)
      .eq('run_date', prevDate)
      .eq('status', 'completed')
      .maybeSingle()

    const coreResults = allResults.filter(r => r.check_level === 'core')
    const checkErrors = allResults
      .filter(r => r.value && typeof r.value === 'object' && 'error' in (r.value as Record<string, unknown>))
      .map(r => ({ checkKey: r.check_key, message: String((r.value as Record<string, unknown>).error) }))
    const worstFail = coreResults.find(r => r.status === 'fail')
    const worstWarn = coreResults.find(r => r.status === 'warn')
    const topSignal = worstFail?.message ?? worstWarn?.message ?? 'All core checks passing'

    // Per-project client alert — separate from the owner digest, only to
    // the address configured on this specific project, only about this
    // one project's data.
    if (scoreTotal < project.alert_threshold && project.alert_email) {
      const { data: lastAlert } = await supabase.from('alert_log')
        .select('sent_at').eq('project_id', project.id)
        .order('sent_at', { ascending: false }).limit(1).single()
      const lastDate = lastAlert?.sent_at ? new Date(lastAlert.sent_at).toISOString().split('T')[0] : null
      if (lastDate !== runDate) {
        await supabase.from('alert_log').insert({ project_id: project.id, run_id: run.id, score: scoreTotal })

        const { data: trendRaw } = await supabase
          .from('dqs_runs')
          .select('run_date, score_total')
          .eq('project_id', project.id)
          .eq('status', 'completed')
          .order('run_date', { ascending: false })
          .limit(10)
        const trend = (trendRaw ?? [])
          .filter((r: { run_date: string; score_total: number | null }) => r.score_total != null)
          .reverse()
          .map((r: { run_date: string; score_total: number }) => ({ runDate: r.run_date, score: r.score_total }))

        const failing = allResults.filter(r => r.status === 'fail').map(r => ({ checkKey: r.check_key, message: r.message }))
        const warning = allResults.filter(r => r.status === 'warn').map(r => ({ checkKey: r.check_key, message: r.message }))
        const passing = allResults.filter(r => r.status === 'pass')

        await sendEmail({
          to: project.alert_email,
          ...renderClientAlertEmail({
            projectId: project.id,
            projectName: project.name,
            shareToken: project.share_token,
            scoreTotal: finalScore,
            prevScore: prevRun?.score_total ?? null,
            alertThreshold: project.alert_threshold,
            trend,
            failing,
            warning,
            passingCount: passing.length,
            passingLabels: passing.slice(0, 10).map(r => r.check_key),
          }),
        })
      }
    }

    return {
      projectId: project.id,
      processed: true,
      digestEntry: {
        projectId: project.id,
        name: project.name,
        runStatus: 'completed',
        checkErrors,
        scoreTotal: finalScore,
        prevScore: prevRun?.score_total ?? null,
        topSignal,
        belowThreshold: finalScore < project.alert_threshold,
        alertThreshold: project.alert_threshold,
      },
    }
  } catch (e: any) {
    await supabase.from('dqs_runs').update({ status: 'failed', error_message: e.message }).eq('id', run.id)
    return {
      projectId: project.id,
      processed: false,
      errorMessage: e.message,
      digestEntry: {
        projectId: project.id,
        name: project.name,
        runStatus: 'failed',
        errorMessage: e.message,
        checkErrors: [],
        scoreTotal: null,
        prevScore: null,
        topSignal: '',
        belowThreshold: true,
        alertThreshold: project.alert_threshold,
      },
    }
  }
}

// ============================================================
// ROUTE HANDLERS
// ============================================================
// GET — wywoływany przez Vercel Cron (codziennie 23:00 UTC, bez body).
// Przetwarza tylko projekty z auto_run = true.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runWorker(null)
}

// POST — wywoływany przyciskiem "Run now" z UI, zawsze z konkretnym project_id.
// Manualny run działa niezależnie od auto_run (patrz opis w UI: "Disabled —
// use Run now to check manually").
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const projectId: string | undefined = body.project_id

  // A signed-in user's manual "Run now" must own the project it targets —
  // otherwise any logged-in account could force a run (and its side effects:
  // GA4 quota usage, a new dqs_runs row, a client alert email) on someone
  // else's project just by guessing/copying its id. The cron path (secret
  // bearer token, no project_id) is exempt — it always runs the full
  // auto_run set, never an attacker-supplied id.
  if (!isCronRequest(request)) {
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()
    const { data: project } = await admin.from('projects').select('owner_id').eq('id', projectId).single()
    if (!user || !project || project.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return runWorker(projectId ?? null)
}

async function runWorker(projectId: string | null) {
  const supabase = createAdminClient()
  const runDate = new Date().toISOString().split('T')[0]

  // Fetch projects — manualny run bierze konkretny projekt niezależnie od
  // auto_run; automatyczny (cron) run bierze tylko projekty z auto_run = true.
  let query = supabase.from('projects').select('*').eq('status', 'active')
  query = projectId ? query.eq('id', projectId) : query.eq('auto_run', true)
  const { data: projects } = await query

  const processed: string[] = []
  const errors: Record<string, string> = {}
  const digestEntries: DigestEntry[] = []

  const prevDateObj = new Date(runDate)
  prevDateObj.setDate(prevDateObj.getDate() - 1)
  const prevDate = prevDateObj.toISOString().split('T')[0]

  const isAutoRunPass = projectId === null
  const outcomes = await runWithConcurrency(
    (projects ?? []) as Project[],
    WORKER_CONCURRENCY,
    project => processProject(supabase, project, runDate, prevDate, isAutoRunPass)
  )

  for (const outcome of outcomes) {
    if (!outcome) continue
    if (outcome.processed) processed.push(outcome.projectId)
    if (outcome.errorMessage) errors[outcome.projectId] = outcome.errorMessage
    digestEntries.push(outcome.digestEntry)
  }

  // Owner digest — only for the automatic (cron) pass across all projects,
  // never for a single-project manual "Run now".
  if (!projectId && digestEntries.length > 0 && process.env.DIGEST_EMAIL) {
    await sendEmail({ to: process.env.DIGEST_EMAIL, ...renderOwnerDigestEmail(digestEntries, runDate) })
  }

  return NextResponse.json({ ok: true, processed, errors, run_date: runDate })
}
