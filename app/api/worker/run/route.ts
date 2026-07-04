import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Project, CheckResult } from '@/types'

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
// Google token refresh
// ============================================================
async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId     = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error_description ?? data.error}`)
  return data.access_token
}

// ============================================================
// GA4 Data API helper
// ============================================================
async function ga4Report(propertyId: string, token: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`GA4 API ${res.status}: ${err.error?.message ?? res.statusText}`)
  }
  return res.json()
}

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

// Standard GA4 parameter → Data API dimension name mapping
// These are auto-collected by GA4 and don't need custom dimension registration
const GA4_STANDARD_PARAMS: Record<string, string> = {
  transaction_id: 'transactionId',
  currency:       'currencyCode',
  item_id:        'itemId',
  item_name:      'itemName',
  item_brand:     'itemBrand',
  item_category:  'itemCategory',
  item_variant:   'itemVariant',
  affiliation:    'orderCoupon',
  coupon:         'orderCoupon',
}
// Standard GA4 metrics (not dimensions)
const GA4_STANDARD_METRICS: Record<string, string> = {
  value:    'purchaseRevenue',
  price:    'itemRevenue',
  quantity: 'itemsAddedToCart',
  shipping: 'shippingAmount',
  tax:      'taxAmount',
}

async function checkParameters(
  project: { ga4_property_id: string },
  token: string,
  paramChecks: { event_name: string; parameter_name: string }[],
  ranges: { current: { startDate: string; endDate: string }; prev: { startDate: string; endDate: string } }
): Promise<CheckResult[]> {
  if (!paramChecks.length) return []
  const w = WEIGHTS['parameter_checks'] ?? 8
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
          message: missing.length === 0 ? 'Wszystkie expected events obecne' : `Brak eventów: ${missing.join(', ')}`,
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
      results.push({ check_key: 'self_referral', check_level: 'core', status: 'pass', score: w, weight: w, value: {}, message: 'Brak skonfigurowanej domeny — check pominięty' })
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
          message: ratio === 0 ? 'Brak self-referrali' : `Self-referral: ${(ratio * 100).toFixed(2)}% sesji`,
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
        message: `Ruch Direct: ${(ratioC * 100).toFixed(1)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
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

  // ── 7. BOT TRAFFIC — NOCNY SPIKE (WoW) ───────────────────
  {
    const w = WEIGHTS.bot_traffic_night
    try {
      const r = await ga4Report(pid, token, {
        dateRanges: [ranges.current, ranges.prev],
        dimensions: [{ name: 'dateRange' }, { name: 'hour' }],
        metrics: [{ name: 'sessions' }],
      })
      const rows = r.rows ?? []
      const nightHours = ['0','1','2','3','4','5']
      const sumNight = (range: string) => rows
        .filter((r: any) => r.dimensionValues?.[0]?.value === range && nightHours.includes(r.dimensionValues?.[1]?.value))
        .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const sumTotal = (range: string) => rows
        .filter((r: any) => r.dimensionValues?.[0]?.value === range)
        .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
      const nightC = sumNight('current'); const totalC = sumTotal('current')
      const nightP = sumNight('prev');   const totalP = sumTotal('prev')
      const ratioC = totalC > 0 ? nightC / totalC : 0
      const ratioP = totalP > 0 ? nightP / totalP : 0
      const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
      const status = delta <= 50 ? 'pass' : delta <= 100 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'bot_traffic_night', check_level: 'core', status, score, weight: w,
        value: { night_ratio_current: +(ratioC * 100).toFixed(1), night_ratio_prev: +(ratioP * 100).toFixed(1), delta: +delta.toFixed(1) },
        message: `Ruch nocny (0–5h): ${(ratioC * 100).toFixed(1)}% (WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
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
        message: newCountries.length === 0 ? 'Top 5 krajów bez zmian' : `Nowe kraje w Top 5: ${newCountries.join(', ')}`,
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
        message: `Szacowane sesje bez zaangażowania: ${(ratio * 100).toFixed(1)}%`,
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
// ROUTE HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json().catch(() => ({}))
  const projectId: string | undefined = body.project_id
  const runDate = new Date().toISOString().split('T')[0]

  // Token z profiles (DB-backed access token + refresh_token).
  // Nie używamy session.provider_token — Supabase nie odświeża tego pola
  // po wymianie kodu OAuth, więc po ~1h staje się nieaktualne mimo że
  // sesja logowania w aplikacji wciąż wygląda jako aktywna.
  let accessToken: string | null = null
  const { data: profile } = await supabase
    .from('profiles')
    .select('ga4_access_token, ga4_refresh_token, ga4_token_expiry')
    .eq('org_id', '00000000-0000-0000-0000-000000000001')
    .order('created_at').limit(1).single()

  if (profile?.ga4_refresh_token) {
    const expiry = profile.ga4_token_expiry ? new Date(profile.ga4_token_expiry) : new Date(0)
    if (expiry <= new Date()) {
      try {
        accessToken = await refreshGoogleToken(profile.ga4_refresh_token)
        await supabase.from('profiles')
          .update({ ga4_access_token: accessToken, ga4_token_expiry: new Date(Date.now() + 3500 * 1000).toISOString() })
          .eq('org_id', '00000000-0000-0000-0000-000000000001')
      } catch (e: any) {
        return NextResponse.json({ error: `Token refresh failed: ${e.message}` }, { status: 401 })
      }
    } else {
      accessToken = profile.ga4_access_token
    }
  } else if (profile?.ga4_access_token) {
    accessToken = profile.ga4_access_token
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })
  }

  // Fetch projects
  let query = supabase.from('projects').select('*').eq('status', 'active')
  if (projectId) query = query.eq('id', projectId)
  const { data: projects } = await query

  const processed: string[] = []
  const errors: Record<string, string> = {}

  for (const project of (projects ?? []) as Project[]) {
    // Create / update run
    const { data: run } = await supabase.from('dqs_runs').upsert({
      project_id: project.id,
      run_date: runDate,
      status: 'running',
      score_total: null,
      error_message: null,
    }, { onConflict: 'project_id,run_date' }).select().single()

    if (!run) continue

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
      const scoreTotal = +allResults.reduce((s, r) => s + r.score, 0).toFixed(2)

      // Keep best score of the day
      const isBetter = !existingRun || scoreTotal >= (existingRun.score_total ?? 0)
      if (isBetter) {
        await supabase.from('dqs_results').delete().eq('run_id', run.id)
        await supabase.from('dqs_results').insert(allResults.map(r => ({ ...r, run_id: run.id })))
        await supabase.from('dqs_runs').update({ status: 'completed', score_total: scoreTotal }).eq('id', run.id)
      } else {
        // Score not better — mark run as completed but keep old results
        await supabase.from('dqs_runs').update({ status: 'completed', score_total: existingRun!.score_total }).eq('id', run.id)
      }

      processed.push(project.id)

      // Alert
      if (scoreTotal < project.alert_threshold && project.alert_email) {
        const { data: lastAlert } = await supabase.from('alert_log')
          .select('sent_at').eq('project_id', project.id)
          .order('sent_at', { ascending: false }).limit(1).single()
        const lastDate = lastAlert?.sent_at ? new Date(lastAlert.sent_at).toISOString().split('T')[0] : null
        if (lastDate !== runDate) {
          await supabase.from('alert_log').insert({ project_id: project.id, run_id: run.id, score: scoreTotal })
          // TODO: Resend.send()
        }
      }
    } catch (e: any) {
      await supabase.from('dqs_runs').update({ status: 'failed', error_message: e.message }).eq('id', run.id)
      errors[project.id] = e.message
    }
  }

  return NextResponse.json({ ok: true, processed, errors, run_date: runDate })
}
