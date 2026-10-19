import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report } from '@/lib/ga4/report'
import { GA4_STANDARD_PARAMS, GA4_STANDARD_METRICS, ITEM_SCOPED_DIMENSIONS, ITEM_METRIC_BY_EVENT } from '@/lib/ga4/standardParams'
import { sendEmail } from '@/lib/email/resend'
import { renderOwnerDigestEmail, type DigestEntry } from '@/lib/email/ownerDigest'
import { renderClientAlertEmail } from '@/lib/email/clientAlert'
import { renderCriticalAlertEmail } from '@/lib/email/criticalAlert'
import { renderReconnectNoticeEmail } from '@/lib/email/reconnectNotice'
import { parseEmailList } from '@/lib/email/shared'
import { ownerHasActiveAccess, TRIAL_EXPIRED_MESSAGE } from '@/lib/billing/access'
import { hasActiveAccess } from '@/lib/billing/plans'
import { getAccessibleOwnerIds } from '@/lib/team/access'
import { memberHasAccessToProperty, NO_GA4_ACCESS_MESSAGE } from '@/lib/ga4/memberAccess'
import { isCronRequest } from '@/lib/worker/cronAuth'
import { AUTO_RUN_MARKER_KEY, currentWarsawDate } from '@/lib/worker/schedule'
import type { Project, CheckResult } from '@/types'

// Default serverless timeout is far too short once this loops over dozens
// of projects sequentially (each doing ~a dozen GA4 calls) — 300s is the
// Vercel Pro plan ceiling; raise further (Enterprise: up to 900s) or lower
// to 60s (Hobby ceiling) to match your actual plan.
export const maxDuration = 300

// ga4Report() already returns the whole response body (rows + metadata),
// but every check just destructures .rows — this thin per-project wrapper
// is how sampling gets noticed at all: it's the one place that also reads
// metadata.samplingMetadatas, so runAllChecks/checkParameters don't each
// need their own copy of that logic.
type Ga4ReportFn = (body: object) => Promise<any>
interface SamplingHit { samplesReadCount: number; samplingSpaceSize: number }

// ============================================================
// Autoryzacja
// ============================================================
// Ten endpoint musi być wywoływalny bez sesji przeglądarki (Vercel Cron —
// codzienny automatyczny run) ORAZ z sesją (klik "Run now" z UI). Middleware
// przepuszcza ten path bez przekierowania na /login, więc autoryzację
// sprawdzamy tutaj: albo poprawny sekret crona, albo zalogowany użytkownik.
// isCronRequest samo w sobie mieszka teraz w lib/worker/cronAuth.ts —
// współdzielone z /api/worker/watchdog.
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
  ecommerce_events:     16,
  self_referral:         7,
  direct_traffic_spike:  8,
  bounce_rate_anomaly:   8,
  conversion_rate:      10,
  page_title_null:       8,
  bot_traffic_night:     9,
  geo_anomaly:           7,
  country_share:         7,
  parameter_checks:     12,
  custom_events:        12,
}

// ============================================================
// GA4 Data API helper
// ============================================================
// ============================================================
// Zakresy dat dla checków porównawczych (current vs prev): zawsze 2 dni
// wstecz vs ten sam dzień tydzień wcześniej — niezależnie od okresu
// wybranego w Period selectorze na ekranie. To jest jedyne co faktycznie
// trafia do dqs_runs/dqs_results (i napędza score/trend/alerty mailowe),
// żeby historia była spójna bez względu na to, kto/co odpalił run i co
// akurat było zaznaczone w UI. Widoki live (Traffic/Engagement/Users/
// Events/Parameters, patrz /api/ga4/checks i /api/ga4/events) reagują na
// Period osobno, nigdy nie nadpisując tej historii.
//
// -2 dni, nie -1 (wczoraj): to jest automatyczny, bezobsługowy przebieg —
// nie ma tu użytkownika, który mógłby zaznaczyć "Exclude yesterday" tak
// jak w live UI, gdy dane za wczoraj są jeszcze niekompletne/przetwarzane
// przez GA4. Domyślne pomijanie wczoraj tutaj jest więc na stałe, nie
// opcjonalne — codzienny automatyczny run zawsze sprawdza dane sprzed
// 2 dni, o które GA4 zdążyło się już w pełni "domknąć".
//
// `new Date()` tutaj to zawsze UTC (środowisko Vercel), a harmonogram
// crona w vercel.json też jest zawsze w UTC — niezależnie od tego, co
// pokazuje zegar w Polsce. Stąd realny wymóg: godzina crona MUSI leżeć
// wygodnie w środku tej samej doby UTC co polska data kalendarzowa, a nie
// tuż po polskiej północy. Wcześniejsze "0 23 * * *" (23:00 UTC) odpalało
// się ok. 00:00–01:00 czasu polskiego (zależnie od DST) — czyli już
// "następnego dnia" dla obserwatora w Polsce, ale WCIĄŻ poprzedniego dnia
// UTC, więc -2 dni liczyło się od dnia o jeden za wczesnego i finalnie
// sprawdzało dane sprzed 3 dni kalendarzowych w Polsce, nie 2. Teraz cron
// (vercel.json) celuje w 7:30 polskiego czasu — patrz komentarz przy
// handlerze GET niżej po pełne szczegóły (i czemu to nie jest już prosty
// gate na dokładną godzinę).
// ============================================================
function getDailyRanges() {
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const today = new Date()

  const checkedDate = new Date(today); checkedDate.setDate(today.getDate() - 2)
  const lastWeek     = new Date(today); lastWeek.setDate(today.getDate() - 9)

  return {
    current: { startDate: fmt(checkedDate), endDate: fmt(checkedDate), name: 'current' },
    prev:    { startDate: fmt(lastWeek), endDate: fmt(lastWeek), name: 'prev' },
  }
}


// ============================================================
// 8 CORE CHECKÓW
// ============================================================

// ============================================================
// Parameter coverage check
// ============================================================

async function checkParameters(
  project: { ga4_property_id: string },
  report: Ga4ReportFn,
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
        const eventFilter = { filter: { fieldName: 'eventName', stringFilter: { value: event_name } } }

        if (stdMetric) {
          // For value/price etc — check if metric > 0 (presence, not coverage)
          const data = await report({
            dateRanges: [dateRange],
            metrics:    [{ name: stdMetric }],
            dimensionFilter: eventFilter,
          })
          const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value ?? '0')
          return val > 0 ? 100 : 0
        }

        // total/withParam used to come from a `limit: 100`-bounded dimension
        // breakdown — for a high-cardinality parameter (e.g. transaction_id,
        // effectively unique per event) the real per-value rows have a
        // count of ~1 each and get crowded out of that top-100 sample by the
        // single aggregated "(not set)" bucket, understating coverage
        // (a ~100%-covered parameter could read as ~25%). Querying the two
        // aggregates directly — no dimension breakout, so no cardinality
        // limit applies — is exact regardless of how many distinct values
        // the parameter has.
        if (stdDim && ITEM_SCOPED_DIMENSIONS.has(stdDim)) {
          const itemMetric = ITEM_METRIC_BY_EVENT[event_name]
          if (!itemMetric) {
            throw new Error(`Coverage check not supported for item-scoped parameter "${parameter_name}" on event "${event_name}"`)
          }
          // No eventName filter here — the item metric is already specific
          // to that event (e.g. itemsAddedToCart only counts add_to_cart).
          const [totalData, emptyData] = await Promise.all([
            report({ dateRanges: [dateRange], metrics: [{ name: itemMetric }] }),
            report({
              dateRanges: [dateRange],
              metrics:    [{ name: itemMetric }],
              dimensionFilter: { filter: { fieldName: stdDim, inListFilter: { values: ['(not set)', ''] } } },
            }),
          ])
          const total     = parseFloat(totalData.rows?.[0]?.metricValues?.[0]?.value ?? '0')
          const emptyCount = parseFloat(emptyData.rows?.[0]?.metricValues?.[0]?.value ?? '0')
          const withParam = Math.max(0, total - emptyCount)
          return total > 0 ? (withParam / total) * 100 : 0
        }

        const [totalData, emptyData] = await Promise.all([
          report({ dateRanges: [dateRange], metrics: [{ name: 'eventCount' }], dimensionFilter: eventFilter }),
          report({
            dateRanges: [dateRange],
            metrics:    [{ name: 'eventCount' }],
            dimensionFilter: { andGroup: { expressions: [eventFilter, { filter: { fieldName: dimName, inListFilter: { values: ['(not set)', ''] } } }] } },
          }),
        ])
        const total     = parseFloat(totalData.rows?.[0]?.metricValues?.[0]?.value ?? '0')
        const emptyCount = parseFloat(emptyData.rows?.[0]?.metricValues?.[0]?.value ?? '0')
        const withParam = Math.max(0, total - emptyCount)
        return total > 0 ? (withParam / total) * 100 : 0
      }

      const [covC, covP] = await Promise.all([getCoverage(rangeC), getCoverage(rangeP)])
      const delta  = +(covC - covP).toFixed(1)
      // Coupon usage is inherently partial — most purchases don't use one,
      // so near-100% coverage was never a realistic bar. Unlike every other
      // parameter, this only checks the field is wired up at all (a
      // non-trivial share of events actually carry a coupon value), not
      // how many customers happened to use one — never scored as a hard
      // 'fail', just a 'warn' when essentially nobody has one on record.
      const status = parameter_name === 'coupon'
        ? (covC >= 1 ? 'pass' : 'warn')
        : (covC >= 90 ? 'pass' : covC >= 70 ? 'warn' : 'fail')
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

async function runAllChecks(project: Project, report: Ga4ReportFn, ecomEvents: string[] = [], customEventChecks: {event_name: string; check_type: string}[] = []): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const ranges = getDailyRanges()

  // ── 1. EXPECTED EVENTS ──────────────────────────────────
  {
    const w = WEIGHTS.expected_events
    const expected = project.expected_events ?? []
    if (expected.length === 0) {
      results.push({ check_key: 'expected_events', check_level: 'core', status: 'pass', score: w, weight: w, value: {}, message: 'No expected events configured — check skipped' })
    } else {
      try {
        const r = await report({
          dateRanges: [ranges.current],
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
      // Stored status stays 'pass' — the dqs_results.status column only
      // accepts pass/warn/fail, and a 'skip' value here made the WHOLE
      // batch insert for the day fail (Postgres rejects the entire insert
      // on one constraint violation), silently wiping every check for that
      // run, not just this one. The "not configured" treatment is display
      // -only, driven off value.not_configured (the live self-referral
      // check on the project page does the same — see /api/ga4/checks).
      results.push({ check_key: 'self_referral', check_level: 'core', status: 'pass', score: w, weight: w, value: { not_configured: true }, message: 'Self-referral check requires a domain — add it in project Settings to enable this check.' })
    } else {
      try {
        const bySource = async (dateRange: object) => {
          const r = await report({
            dateRanges: [dateRange],
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
          return { ratio: total > 0 ? selfSessions / total : 0, selfSessions, total }
        }
        const [curr, prev] = await Promise.all([bySource(ranges.current), bySource(ranges.prev)])
        const delta = prev.ratio > 0 ? +(((curr.ratio - prev.ratio) / prev.ratio) * 100).toFixed(1) : 0
        const status = curr.ratio === 0 ? 'pass' : curr.ratio < 0.02 ? 'warn' : 'fail'
        const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
        results.push({
          check_key: 'self_referral', check_level: 'core', status, score, weight: w,
          value: { ratio: +(curr.ratio * 100).toFixed(2), ratio_prev: +(prev.ratio * 100).toFixed(2), delta, self_sessions: curr.selfSessions, total: curr.total },
          message: curr.ratio === 0 ? 'No self-referrals' : `Self-referral: ${(curr.ratio * 100).toFixed(2)}% of sessions (WoW: ${delta >= 0 ? '+' : ''}${delta}%)`,
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
        report({ dateRanges: [ranges.current], metrics: [{ name: 'bounceRate' }] }),
        report({ dateRanges: [ranges.prev],    metrics: [{ name: 'bounceRate' }] }),
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
        message: `Bounce rate: ${(curr * 100).toFixed(1)}% (prev: ${(prev * 100).toFixed(1)}%, WoW: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
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
        report({ dateRanges: [ranges.current], dimensions: [{ name: 'sessionMedium' }], metrics: [{ name: 'sessions' }] }),
        report({ dateRanges: [ranges.prev],    dimensions: [{ name: 'sessionMedium' }], metrics: [{ name: 'sessions' }] }),
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
        report({ dateRanges: [ranges.current], metrics: [{ name: 'sessions' }, { name: 'conversions' }] }),
        report({ dateRanges: [ranges.prev],    metrics: [{ name: 'sessions' }, { name: 'conversions' }] }),
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

  // ── 6. PAGE_TITLE NULL RATE (WoW) ────────────────────────
  {
    const w = WEIGHTS.page_title_null
    try {
      const nullRateFor = async (dateRange: object) => {
        const r = await report({
          dateRanges: [dateRange],
          dimensions: [{ name: 'pageTitle' }],
          metrics: [{ name: 'sessions' }],
          limit: 100,
        })
        const rows = r.rows ?? []
        const total = rows.reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
        const nullSessions = rows
          .filter((r: any) => !r.dimensionValues?.[0]?.value || r.dimensionValues?.[0]?.value === '(not set)')
          .reduce((s: number, r: any) => s + parseInt(r.metricValues?.[0]?.value ?? '0'), 0)
        return { ratio: total > 0 ? nullSessions / total : 0, nullSessions, total }
      }
      const [curr, prev] = await Promise.all([nullRateFor(ranges.current), nullRateFor(ranges.prev)])
      const delta = prev.ratio > 0 ? +(((curr.ratio - prev.ratio) / prev.ratio) * 100).toFixed(1) : 0
      const status = curr.ratio < 0.02 ? 'pass' : curr.ratio < 0.10 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'page_title_null', check_level: 'core', status, score, weight: w,
        value: { null_rate: +(curr.ratio * 100).toFixed(2), null_rate_prev: +(prev.ratio * 100).toFixed(2), delta, null_sessions: curr.nullSessions, total: curr.total },
        message: `page_title null rate: ${(curr.ratio * 100).toFixed(2)}% (WoW: ${delta >= 0 ? '+' : ''}${delta}%)`,
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
        report({ dateRanges: [ranges.current], dimensions: [{ name: 'hour' }], metrics: [{ name: 'sessions' }] }),
        report({ dateRanges: [ranges.prev],    dimensions: [{ name: 'hour' }], metrics: [{ name: 'sessions' }] }),
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
        report({ dateRanges: [ranges.current], metrics: [{ name: 'sessions' }, { name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'purchase' } } } }),
        report({ dateRanges: [ranges.prev],    metrics: [{ name: 'sessions' }, { name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'purchase' } } } }),
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
      // Fetches the full country breakdown (not just the top 5) so "new"
      // means genuinely absent from the previous period, not merely
      // outside an arbitrary top-N cutoff — and so a share of total
      // traffic can actually be computed. Previously any country newly
      // cracking the top 5 triggered this, even a country contributing a
      // single session — flagged real newcomers and total non-issues the
      // same way. Now only counts as an anomaly once it's actually
      // material: a brand-new country pulling more than 3% of the day's
      // total sessions.
      const [rC, rP] = await Promise.all([
        report({ dateRanges: [ranges.current], dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], limit: 250 }),
        report({ dateRanges: [ranges.prev],    dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], limit: 250 }),
      ])
      const rowsC: { country: string; sessions: number }[] = (rC.rows ?? []).map((r: any) => ({ country: r.dimensionValues?.[0]?.value as string, sessions: parseInt(r.metricValues?.[0]?.value ?? '0') }))
      const rowsP: { country: string; sessions: number }[] = (rP.rows ?? []).map((r: any) => ({ country: r.dimensionValues?.[0]?.value as string, sessions: parseInt(r.metricValues?.[0]?.value ?? '0') }))
      const totalC = rowsC.reduce((s, r) => s + r.sessions, 0)
      const prevCountries = new Set(rowsP.map(r => r.country))
      const GEO_ANOMALY_MIN_SHARE_PCT = 3
      const newCountries = rowsC
        .filter(r => !prevCountries.has(r.country) && totalC > 0 && (r.sessions / totalC) * 100 > GEO_ANOMALY_MIN_SHARE_PCT)
        .map(r => r.country)
      const status = newCountries.length === 0 ? 'pass' : newCountries.length === 1 ? 'warn' : 'fail'
      const score = status === 'pass' ? w : status === 'warn' ? w * 0.5 : 0
      results.push({
        check_key: 'geo_anomaly', check_level: 'optional', status, score, weight: w,
        value: { new_countries: newCountries, total_sessions: totalC },
        message: newCountries.length === 0
          ? `No new countries above ${GEO_ANOMALY_MIN_SHARE_PCT}% of traffic`
          : `New countries above ${GEO_ANOMALY_MIN_SHARE_PCT}% of traffic: ${newCountries.join(', ')}`,
      })

      // Composition check, complementary to geo_anomaly above (which only
      // catches brand-new countries) — this catches drift even among
      // countries that were already present, e.g. a slow bot crawl or a
      // misconfigured redirect sending real share somewhere it shouldn't
      // be. Derived from the same rowsC/totalC fetched above — no extra
      // GA4 call needed.
      const wCountryShare = WEIGHTS.country_share
      const DOMINANT_COUNTRY_MIN_SHARE_PCT = 60
      const dominant = rowsC
        .filter(r => r.country !== '(not set)')
        .reduce((max, r) => (r.sessions > (max?.sessions ?? -1) ? r : max), null as { country: string; sessions: number } | null)
      const notSetSessions = rowsC.find(r => r.country === '(not set)')?.sessions ?? 0
      const dominantShare = totalC > 0 && dominant ? (dominant.sessions / totalC) * 100 : 0
      const notSetShare = totalC > 0 ? (notSetSessions / totalC) * 100 : 0
      const otherShare = Math.max(0, 100 - dominantShare - notSetShare)
      const otherCountries = rowsC
        .filter(r => r.country !== '(not set)' && (!dominant || r.country !== dominant.country))
        .map(r => ({ country: r.country, share: totalC > 0 ? (r.sessions / totalC) * 100 : 0 }))
        .filter(r => r.share > 0)
        .sort((a, b) => b.share - a.share)
      // totalC === 0 (no sessions at all this period) must not fall through
      // to "100% is elsewhere" — that's an absence of data, not a geographic
      // anomaly; otherShare is meaningless with nothing to divide. Likewise,
      // services with naturally global/diversified traffic (no single
      // country above DOMINANT_COUNTRY_MIN_SHARE_PCT) have no "dominant"
      // baseline to measure drift against — otherShare would always look
      // large there even though nothing changed, so skip the check rather
      // than false-alarm every day.
      const hasDominantCountry = dominantShare > DOMINANT_COUNTRY_MIN_SHARE_PCT
      const countryShareStatus = totalC === 0 || !hasDominantCountry ? 'pass' : otherShare > 10 ? 'fail' : otherShare > 5 ? 'warn' : 'pass'
      const countryShareScore = countryShareStatus === 'pass' ? wCountryShare : countryShareStatus === 'warn' ? wCountryShare * 0.5 : 0
      results.push({
        check_key: 'country_share', check_level: 'optional', status: countryShareStatus, score: countryShareScore, weight: wCountryShare,
        value: {
          dominant_country: dominant?.country ?? null,
          dominant_share: +dominantShare.toFixed(1),
          not_set_share: +notSetShare.toFixed(1),
          other_share: +otherShare.toFixed(1),
          other_countries: otherCountries.map(c => ({ country: c.country, share: +c.share.toFixed(1) })),
        },
        message: totalC === 0
          ? 'No session data available for this period'
          : !dominant
          ? 'No country data available'
          : !hasDominantCountry
          ? `No single dominant country (largest: ${dominant.country} ${dominantShare.toFixed(1)}%) — check skipped`
          : `${dominant.country} + (not set): ${(dominantShare + notSetShare).toFixed(1)}%` + (otherShare > 5
              ? ` — other countries: ${otherCountries.slice(0, 3).map(c => `${c.country} ${c.share.toFixed(1)}%`).join(', ')}${otherCountries.length > 3 ? ` +${otherCountries.length - 3} more` : ''}`
              : ' — everything else under 5%'),
      })
    } catch (e: any) {
      results.push({ check_key: 'geo_anomaly', check_level: 'optional', status: 'fail', score: 0, weight: w, value: { error: e.message }, message: `API error: ${e.message}` })
      results.push({ check_key: 'country_share', check_level: 'optional', status: 'fail', score: 0, weight: WEIGHTS.country_share, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

  // ── CUSTOM EVENTS: configured event checks ───────────────────
  if (customEventChecks.length > 0) {
    try {
      const eventNames = customEventChecks.map(e => e.event_name)
      const [rC, rP] = await Promise.all([
        report({
          dateRanges: [ranges.current],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: eventNames } } },
        }),
        report({
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
      const wPerEv = +(WEIGHTS.custom_events / Math.max(eventNames.length, 1)).toFixed(2)
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
      results.push({ check_key: 'custom_events_check', check_level: 'core', status: 'fail', score: 0, weight: WEIGHTS.custom_events, value: { error: e.message }, message: `API error: ${e.message}` })
    }
  }

    // ── ECOMMERCE: configured events volume check ───────────────
  if (ecomEvents.length > 0) {
    try {
      const [rC, rP] = await Promise.all([
        report({
          dateRanges: [ranges.current],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ecomEvents } } },
        }),
        report({
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
      const w = WEIGHTS.ecommerce_events
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
      results.push({ check_key: 'ecommerce_events', check_level: 'core', status: 'fail', score: 0, weight: WEIGHTS.ecommerce_events, value: { error: e.message }, message: `API error: ${e.message}` })
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

// How many projects ONE cron firing takes off the pending list — see the
// rolling-window design below (ROLL_WINDOW_START_MIN etc). At concurrency 8,
// a heavy project (many custom parameters — now unlimited on every plan,
// each costing its own sequential GA4 call in checkParameters) can take
// 20-30s; 50 projects / 8 concurrency * ~30s ≈ 190s, comfortably inside the
// 300s maxDuration even in the worst case. Safe to raise once real
// per-project timing from production logs says there's headroom.
const WORKER_BATCH_SIZE = 50

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

// How many consecutive days (including today) each currently-failing/warning
// check has been non-passing, for the "Nth day in a row" badge in the client
// alert email. Purely cosmetic — on any query error this fails open by
// returning an empty map, which the caller treats as "new today" for every
// check rather than blocking the email.
const STREAK_LOOKBACK_DAYS = 14

async function computeStreakDays(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  runDate: string,
  nonPassingKeys: string[]
): Promise<Map<string, number>> {
  if (nonPassingKeys.length === 0) return new Map()
  try {
    const { data: pastRuns, error: runsError } = await supabase
      .from('dqs_runs')
      .select('id, run_date')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .lt('run_date', runDate)
      .order('run_date', { ascending: false })
      .limit(STREAK_LOOKBACK_DAYS)
    if (runsError) throw runsError

    const pastRunList = (pastRuns ?? []) as { id: string; run_date: string }[]
    const pastRunIds = pastRunList.map((r: { id: string; run_date: string }) => r.id)
    const runDateById = new Map(pastRunList.map((r: { id: string; run_date: string }) => [r.id, r.run_date]))
    const sortedPastDates = [...new Set(pastRunList.map((r: { id: string; run_date: string }) => r.run_date))].sort((a, b) => b.localeCompare(a))

    const { data: pastResultsRaw, error: resultsError } = pastRunIds.length
      ? await supabase.from('dqs_results').select('run_id, check_key, status').in('run_id', pastRunIds).in('check_key', nonPassingKeys)
      : { data: [] as { run_id: string; check_key: string; status: string }[], error: null }
    if (resultsError) throw resultsError
    const pastResults = (pastResultsRaw ?? []) as { run_id: string; check_key: string; status: string }[]

    const statusByCheck = new Map<string, Map<string, string>>()
    for (const r of pastResults) {
      const date = runDateById.get(r.run_id)
      if (!date) continue
      if (!statusByCheck.has(r.check_key)) statusByCheck.set(r.check_key, new Map())
      statusByCheck.get(r.check_key)!.set(date, r.status)
    }

    const streaks = new Map<string, number>()
    for (const key of nonPassingKeys) {
      let streak = 1 // today always counts as day 1
      const byDate = statusByCheck.get(key)
      for (const date of sortedPastDates) {
        const status = byDate?.get(date)
        if (status === 'fail' || status === 'warn') streak++
        else break
      }
      streaks.set(key, streak)
    }
    return streaks
  } catch (e: any) {
    console.error('[worker] Streak lookup failed — client alert email will show "New today" for all issues:', e.message)
    return new Map()
  }
}

// One project's full check pipeline — extracted from the worker loop so it
// can run concurrently across projects instead of every project waiting on
// the one before it.
async function processProject(
  supabase: ReturnType<typeof createAdminClient>,
  project: Project,
  runDate: string,
  prevDate: string,
  isAutoRunPass: boolean,
  checkedDate: string
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

    // Wraps every GA4 call this run makes so quota/sampling instrumentation
    // lives in one place instead of every check needing its own copy:
    // - returnPropertyQuota surfaces how much of the property's daily/hourly
    //   GA4 API quota is used — shown on the Billing page.
    // - metadata.samplingMetadatas tells us whether THIS query's numbers
    //   were sampled rather than exact — surfaced on the project page.
    const samplingHits: SamplingHit[] = []
    let quotaSnapshot: Record<string, unknown> | null = null
    const report: Ga4ReportFn = async (body) => {
      const data = await ga4Report(project.ga4_property_id, accessToken, { ...body, returnPropertyQuota: true })
      if (data?.propertyQuota) quotaSnapshot = data.propertyQuota
      for (const s of data?.metadata?.samplingMetadatas ?? []) {
        const samplesReadCount = Number(s.samplesReadCount ?? 0)
        const samplingSpaceSize = Number(s.samplingSpaceSize ?? 0)
        if (samplingSpaceSize > 0) samplingHits.push({ samplesReadCount, samplingSpaceSize })
      }
      return data
    }

    const [results, paramResults] = await Promise.all([
      runAllChecks(project, report, ecomEvents, customEventChecks),
      checkParameters(project, report, paramChecks, getDailyRanges()),
    ])
    const allResults = [...results, ...paramResults]

    // Persisted regardless of the "keep best score" outcome below — quota
    // and sampling reflect this run's actual GA4 calls, not the score.
    if (quotaSnapshot) {
      await supabase.from('projects').update({ ga4_quota: quotaSnapshot, ga4_quota_checked_at: new Date().toISOString() }).eq('id', project.id)
    }
    const totalRead = samplingHits.reduce((s, h) => s + h.samplesReadCount, 0)
    const totalSpace = samplingHits.reduce((s, h) => s + h.samplingSpaceSize, 0)
    const sampled = samplingHits.length > 0
    const samplingRatio = sampled && totalSpace > 0 ? +(totalRead / totalSpace).toFixed(4) : null
    // Normalizacja do rzeczywistej sumy wag checków, które się wykonały
    // w tym przebiegu — 10 zawsze aktywnych checków sumuje się do 100,
    // ale Ecommerce/Custom events/Parameter checks są doliczane tylko
    // gdy dany projekt ma je skonfigurowane, więc "100%" musi być liczone
    // względem tego, co faktycznie brało udział w tym przebiegu, a nie
    // względem sztywnej sumy — inaczej wynik przekraczałby 100.
    const totalWeight = allResults.reduce((s, r) => s + r.weight, 0)
    const rawScore = allResults.reduce((s, r) => s + r.score, 0)
    const scoreTotal = totalWeight > 0 ? +((rawScore / totalWeight) * 100).toFixed(2) : 0

    // Keep best score of the day (avoids a same-day re-run with noisier
    // GA4 data — or a manual "Run now" — dragging the displayed score down).
    // This must only affect the displayed score_total, never dqs_results:
    // the check set is driven by live project config (custom events/params/
    // ecommerce can be edited between two same-day runs), so skipping the
    // results write whenever the new score wasn't "better" left deleted
    // checks (e.g. a removed parameter) stuck showing forever.
    const isBetter = !existingRun || scoreTotal >= (existingRun.score_total ?? 0)
    const finalScore = isBetter ? scoreTotal : (existingRun!.score_total ?? scoreTotal)
    await supabase.from('dqs_results').delete().eq('run_id', run.id)
    await supabase.from('dqs_results').insert(allResults.map(r => ({ ...r, run_id: run.id })))
    await supabase.from('dqs_runs').update({ status: 'completed', score_total: finalScore, sampled, sampling_ratio: samplingRatio }).eq('id', run.id)

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
    // one project's data. Sent every day by default, regardless of score —
    // gating it on alert_threshold used to silently drop the one piece of
    // information that mattered most (that something was actually broken)
    // whenever the score stayed just above the line. alert_threshold is
    // kept on the project purely for display/stats (see the trend chart's
    // reference line and the email's own stat below) — it no longer
    // decides whether this email goes out at all. A project can opt into
    // the old "only when something's wrong" behavior via
    // alert_only_on_issues (migration 026), now based on an actual
    // warn/fail in this run's checks rather than a score cutoff.
    const alertEmails = parseEmailList(project.alert_email)
    const failingResults = allResults.filter(r => r.status === 'fail')
    const warningResults = allResults.filter(r => r.status === 'warn')
    const hasIssues = failingResults.length > 0 || warningResults.length > 0
    const shouldSendAlert = alertEmails.length > 0 && (!project.alert_only_on_issues || hasIssues)
    if (shouldSendAlert) {
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

        const passing = allResults.filter(r => r.status === 'pass')

        const streakByCheck = await computeStreakDays(
          supabase, project.id, runDate,
          [...failingResults, ...warningResults].map(r => r.check_key)
        )
        const failing = failingResults.map(r => ({ checkKey: r.check_key, message: r.message, streakDays: streakByCheck.get(r.check_key) }))
        const warning = warningResults.map(r => ({ checkKey: r.check_key, message: r.message, streakDays: streakByCheck.get(r.check_key) }))

        await sendEmail({
          to: alertEmails,
          ...renderClientAlertEmail({
            projectId: project.id,
            projectName: project.name,
            shareToken: project.share_token,
            scoreTotal: finalScore,
            prevScore: prevRun?.score_total ?? null,
            alertThreshold: project.alert_threshold,
            dataDate: checkedDate,
            trend,
            failing,
            warning,
            passingCount: passing.length,
            passingLabels: passing.slice(0, 10).map(r => r.check_key),
            allChecks: allResults.map(r => ({ checkKey: r.check_key, status: r.status as 'pass' | 'warn' | 'fail' })),
          }),
        })
      }
    }

    // Critical metric alert — a second, separate alert channel, independent
    // of the score threshold above. Fires only when one of the specific
    // checks hand-picked in project settings (core, custom events,
    // ecommerce, parameters) shows warn/fail, so a stakeholder who only
    // cares about a handful of metrics isn't stuck watching the overall
    // score to notice a problem in just those.
    const criticalAlertEmails = parseEmailList(project.critical_alert_email)
    const criticalCheckKeys = new Set(project.critical_alert_checks ?? [])
    if (criticalAlertEmails.length > 0 && criticalCheckKeys.size > 0) {
      const criticalIssues = allResults
        .filter(r => criticalCheckKeys.has(r.check_key) && (r.status === 'fail' || r.status === 'warn'))
        .map(r => ({ checkKey: r.check_key, status: r.status as 'fail' | 'warn', message: r.message }))

      if (criticalIssues.length > 0) {
        const { data: lastCriticalAlert } = await supabase.from('critical_alert_log')
          .select('sent_at').eq('project_id', project.id)
          .order('sent_at', { ascending: false }).limit(1).single()
        const lastCriticalDate = lastCriticalAlert?.sent_at ? new Date(lastCriticalAlert.sent_at).toISOString().split('T')[0] : null
        if (lastCriticalDate !== runDate) {
          await supabase.from('critical_alert_log').insert({ project_id: project.id, run_id: run.id })
          await sendEmail({
            to: criticalAlertEmails,
            ...renderCriticalAlertEmail({
              projectId: project.id,
              projectName: project.name,
              shareToken: project.share_token,
              dataDate: checkedDate,
              issues: criticalIssues,
            }),
          })
        }
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

// Vercel Cron is UTC-only — no per-job timezone option — so a single
// fixed UTC schedule drifts an hour against Polish wall-clock time every
// time DST flips (this is exactly how the previous "23:00 UTC" schedule
// ended up checking data from the wrong calendar day). vercel.json fires
// this route every 10 minutes across a UTC band (04:00-07:50) wide enough
// to cover 06:30-08:30 Warsaw time in both CET and CEST — most firings
// land outside the real local window and no-op immediately below.
//
// ROLLING WINDOW, not a single shot: instead of one firing racing every
// project against a single 300s maxDuration (the exact risk flagged when
// this was reviewed for ~1000 users — a timeout mid-batch used to leave
// the rest of that day's projects with zero checks and zero alerts, no
// retry), each firing inside the window takes up to WORKER_BATCH_SIZE
// projects off whatever's still pending for today and returns. The next
// firing ~10 minutes later picks up wherever the last one left off — see
// fetchPendingAutoRunProjectIds, which treats "has a dqs_runs row for
// today" as the per-project resume marker (the existing onConflict
// upsert already makes this idempotent).
//
// Two independent, fail-open safety nets carry over unchanged from before:
//   1. A tolerance window (checked by minute, not an exact firing time)
//      absorbs scheduling jitter on any plan tier.
//   2. AUTO_RUN_MARKER_KEY (app_config) — now written only once ALL
//      pending projects for today have a run, not before the batch even
//      starts — stops further firings from re-querying once the day is
//      done, and is what /api/worker/watchdog checks. If reading/writing
//      it fails for any reason, this fails OPEN (keeps checking pending
//      work) rather than silently stopping, since a missed day of alerts
//      is worse than an extra query.
// A SEPARATE marker (DIGEST_SENT_MARKER_KEY) gates the owner digest email,
// deliberately not reused from AUTO_RUN_MARKER_KEY — see sendDailyDigestIfDue
// for why coupling them is exactly what silently swallowed the digest before.
const ROLL_WINDOW_START_MIN = 6 * 60 + 30 // 06:30 Warsaw
const ROLL_WINDOW_END_MIN   = 8 * 60 + 30 // 08:30 Warsaw
const DIGEST_SENT_MARKER_KEY = 'worker_last_digest_sent_date'

function currentWarsawMinuteOfDay(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0') % 24
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

async function readMarker(admin: ReturnType<typeof createAdminClient>, key: string): Promise<string | null> {
  try {
    const { data, error } = await admin.from('app_config').select('value').eq('key', key).maybeSingle()
    if (error) throw error
    return data?.value ?? null
  } catch (e: any) {
    console.error(`[worker] Could not read marker "${key}" — failing open:`, e.message)
    return null
  }
}

async function writeMarker(admin: ReturnType<typeof createAdminClient>, key: string, value: string): Promise<void> {
  try {
    const { error } = await admin.from('app_config').upsert({ key, value })
    if (error) throw error
  } catch (e: any) {
    // Non-fatal — worst case this gets re-attempted on the next firing,
    // which is far safer than the alternative of appearing done when not.
    console.error(`[worker] Could not write marker "${key}" (non-fatal):`, e.message)
  }
}

async function alreadyRanAutomaticallyToday(admin: ReturnType<typeof createAdminClient>, todayWarsaw: string): Promise<boolean> {
  return (await readMarker(admin, AUTO_RUN_MARKER_KEY)) === todayWarsaw
}

async function markRanAutomaticallyToday(admin: ReturnType<typeof createAdminClient>, todayWarsaw: string): Promise<void> {
  await writeMarker(admin, AUTO_RUN_MARKER_KEY, todayWarsaw)
}

// Which auto_run projects still need a run today. Mirrors runWorker's own
// owner-access filter below (duplicated rather than shared — this runs
// across many firings over two hours and must independently fail open,
// without depending on in-memory state from any other invocation) — without
// it, a lapsed-trial project would never get a dqs_runs row and would look
// "pending" forever, which would stop the window from ever reporting "done"
// and sending the digest.
// Returns null (not []) when the candidate list itself couldn't be read —
// an empty array here means "genuinely nothing pending", which the caller
// uses to mark the whole day complete and send the digest. Collapsing a
// DB error into [] would make a transient outage look exactly like a
// finished day: the marker gets written, the (empty) digest fires, and the
// rest of today's real work never runs — the same class of silent miss
// this rolling-window change exists to prevent. null tells the caller
// "unknown, try again next firing" instead.
async function fetchPendingAutoRunProjectIds(admin: ReturnType<typeof createAdminClient>, runDate: string): Promise<string[] | null> {
  const { data: candidatesRaw, error } = await admin.from('projects').select('id, owner_id').eq('status', 'active').eq('auto_run', true)
  if (error) {
    console.error('[worker] Could not list auto_run projects — will retry on the next firing:', error.message)
    return null
  }
  const candidates = (candidatesRaw ?? []) as { id: string; owner_id: string | null }[]
  if (candidates.length === 0) return []

  const ownerIds = [...new Set(candidates.map(p => p.owner_id).filter((id): id is string => !!id))]
  const { data: ownerProfiles, error: profilesError } = ownerIds.length
    ? await admin.from('profiles').select('id, plan_id, trial_ends_at').in('id', ownerIds)
    : { data: [] as { id: string; plan_id: string | null; trial_ends_at: string | null }[], error: null }
  if (profilesError) {
    console.error('[worker] Owner profile lookup failed while checking pending work — not filtering by plan status:', profilesError.message)
  }
  const accessByOwner = new Map((ownerProfiles ?? []).map((p: { id: string; plan_id: string | null; trial_ends_at: string | null }) => [p.id, hasActiveAccess(p.plan_id, p.trial_ends_at)]))
  const eligible = profilesError ? candidates : candidates.filter(p => !p.owner_id || accessByOwner.get(p.owner_id) === true)
  if (eligible.length === 0) return []

  const ids = eligible.map(p => p.id)
  const { data: doneRuns, error: doneErr } = await admin.from('dqs_runs').select('project_id').eq('run_date', runDate).in('project_id', ids)
  if (doneErr) {
    console.error('[worker] Could not check today\'s completed runs — treating all eligible projects as pending (safe: the dqs_runs upsert is idempotent):', doneErr.message)
    return ids
  }
  const doneSet = new Set((doneRuns ?? []).map((r: { project_id: string }) => r.project_id))
  return ids.filter(id => !doneSet.has(id))
}

// Rebuilds today's full digest from dqs_runs/dqs_results rather than
// carrying in-memory state across firings (impossible anyway — each cron
// firing is a fresh serverless invocation) — this is also what makes the
// digest correct regardless of how many batches it took to get through
// today's projects. Mirrors processProject's own digestEntry construction
// exactly (topSignal = worst core fail/warn message, checkErrors = results
// whose value carries an error) so a multi-batch day produces the same
// digest a single-batch day always did.
async function buildDigestEntriesForDate(admin: ReturnType<typeof createAdminClient>, runDate: string): Promise<DigestEntry[]> {
  const { data: runsRaw, error: runsError } = await admin
    .from('dqs_runs').select('id, project_id, status, score_total, error_message').eq('run_date', runDate)
  if (runsError) {
    console.error('[worker] Could not load today\'s runs for the digest:', runsError.message)
    return []
  }
  const runs = (runsRaw ?? []) as { id: string; project_id: string; status: string; score_total: number | null; error_message: string | null }[]
  if (runs.length === 0) return []

  const projectIds = [...new Set(runs.map(r => r.project_id))]
  const { data: projectsRaw } = await admin.from('projects').select('id, name, alert_threshold').in('id', projectIds)
  const projectById = new Map(((projectsRaw ?? []) as { id: string; name: string; alert_threshold: number }[]).map(p => [p.id, p]))

  const completedRunIds = runs.filter(r => r.status === 'completed').map(r => r.id)
  const { data: resultsRaw } = completedRunIds.length
    ? await admin.from('dqs_results').select('run_id, check_key, check_level, status, message, value').in('run_id', completedRunIds)
    : { data: [] as { run_id: string; check_key: string; check_level: string; status: string; message: string; value: unknown }[] }
  const resultsByRun = new Map<string, { check_key: string; check_level: string; status: string; message: string; value: unknown }[]>()
  for (const r of (resultsRaw ?? []) as { run_id: string; check_key: string; check_level: string; status: string; message: string; value: unknown }[]) {
    if (!resultsByRun.has(r.run_id)) resultsByRun.set(r.run_id, [])
    resultsByRun.get(r.run_id)!.push(r)
  }

  const prevDateObj = new Date(runDate)
  prevDateObj.setDate(prevDateObj.getDate() - 1)
  const prevDate = prevDateObj.toISOString().split('T')[0]
  const { data: prevRunsRaw } = await admin.from('dqs_runs').select('project_id, score_total').eq('run_date', prevDate).eq('status', 'completed').in('project_id', projectIds)
  const prevScoreByProject = new Map(((prevRunsRaw ?? []) as { project_id: string; score_total: number | null }[]).map(r => [r.project_id, r.score_total]))

  const entries: DigestEntry[] = []
  for (const run of runs) {
    const project = projectById.get(run.project_id)
    if (!project) continue // deleted since this morning's run — nothing to show

    if (run.status !== 'completed') {
      entries.push({
        projectId: run.project_id, name: project.name, runStatus: 'failed',
        errorMessage: run.error_message, checkErrors: [], scoreTotal: null, prevScore: null,
        topSignal: '', belowThreshold: true, alertThreshold: project.alert_threshold,
      })
      continue
    }

    const results = resultsByRun.get(run.id) ?? []
    const coreResults = results.filter(r => r.check_level === 'core')
    const checkErrors = results
      .filter(r => r.value && typeof r.value === 'object' && 'error' in (r.value as Record<string, unknown>))
      .map(r => ({ checkKey: r.check_key, message: String((r.value as Record<string, unknown>).error) }))
    const worstFail = coreResults.find(r => r.status === 'fail')
    const worstWarn = coreResults.find(r => r.status === 'warn')
    const topSignal = worstFail?.message ?? worstWarn?.message ?? 'All core checks passing'

    entries.push({
      projectId: run.project_id, name: project.name, runStatus: 'completed',
      checkErrors, scoreTotal: run.score_total, prevScore: prevScoreByProject.get(run.project_id) ?? null,
      topSignal, belowThreshold: (run.score_total ?? 0) < project.alert_threshold, alertThreshold: project.alert_threshold,
    })
  }
  return entries
}

// Sends the owner digest exactly once per day, independently of
// AUTO_RUN_MARKER_KEY — the two used to be the same gate, and that's
// precisely how the digest silently stopped going out once the automatic
// run was split across multiple firings: the marker got written by
// whichever firing finished the batch, every firing after it saw "already
// ran" and skipped straight past the email too. Keeping a SEPARATE
// DIGEST_SENT_MARKER_KEY means a firing that sees "work is done but no
// digest sent yet" (including one that only reaches this via the
// already-ran fast path in GET, below) always gets to try again.
async function sendDailyDigestIfDue(admin: ReturnType<typeof createAdminClient>, todayWarsaw: string, runDate: string): Promise<void> {
  if (!process.env.DIGEST_EMAIL) return
  if ((await readMarker(admin, DIGEST_SENT_MARKER_KEY)) === todayWarsaw) return

  const digestEntries = await buildDigestEntriesForDate(admin, runDate)
  if (digestEntries.length === 0) return

  const checkedDate = getDailyRanges().current.startDate
  const { count: totalActiveProjects } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active')
  const sent = await sendEmail({ to: process.env.DIGEST_EMAIL, ...renderOwnerDigestEmail(digestEntries, runDate, checkedDate, totalActiveProjects ?? 0) })
  if (sent) await writeMarker(admin, DIGEST_SENT_MARKER_KEY, todayWarsaw)
  // sendEmail failing is logged there already and left non-fatal here too —
  // the marker is deliberately NOT written on failure, so the next firing
  // within the window (or the next time anything calls this) retries it.
}

// GET — wywoływany przez Vercel Cron co 10 minut (patrz vercel.json +
// komentarz powyżej o rolling window). Za każdym razem bierze tylko kawałek
// (WORKER_BATCH_SIZE) projektów z auto_run = true, które jeszcze nie miały
// dzisiaj runu — reszta poczeka na kolejne odpalenie w oknie 6:30-8:30.
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const minuteOfDay = currentWarsawMinuteOfDay()
  if (minuteOfDay < ROLL_WINDOW_START_MIN || minuteOfDay > ROLL_WINDOW_END_MIN) {
    return NextResponse.json({ ok: true, skipped: 'outside the Warsaw rolling window (06:30-08:30)' })
  }

  const admin = createAdminClient()
  const todayWarsaw = currentWarsawDate()
  const runDate = new Date().toISOString().split('T')[0]

  if (await alreadyRanAutomaticallyToday(admin, todayWarsaw)) {
    // Work is done for today — but make sure the digest actually went out.
    // Deliberately checked on every firing that lands here, not just the
    // one that finished the batch: if that firing crashed or timed out
    // between marking "ran" and sending the digest, this is what lets a
    // later firing within the window pick it back up instead of the
    // digest silently never going out.
    await sendDailyDigestIfDue(admin, todayWarsaw, runDate)
    return NextResponse.json({ ok: true, skipped: 'already completed today' })
  }

  const pendingIds = await fetchPendingAutoRunProjectIds(admin, runDate)
  if (pendingIds === null) {
    // Couldn't tell what's pending this firing (DB hiccup, already logged).
    // Do NOT mark the day done or touch the digest — just wait for the next
    // firing (10 minutes later, within the same window) to retry, with the
    // watchdog as the backstop if the problem outlasts the whole window.
    return NextResponse.json({ ok: true, skipped: 'could not determine pending work this firing — will retry' })
  }
  if (pendingIds.length === 0) {
    // Nothing left (or nothing to do at all) — today's batch is complete.
    await markRanAutomaticallyToday(admin, todayWarsaw)
    await sendDailyDigestIfDue(admin, todayWarsaw, runDate)
    return NextResponse.json({ ok: true, skipped: 'nothing pending for today' })
  }

  const batchIds = pendingIds.slice(0, WORKER_BATCH_SIZE)
  const result = await runWorker(batchIds, true)

  const stillPending = await fetchPendingAutoRunProjectIds(admin, runDate)
  if (stillPending !== null && stillPending.length === 0) {
    // This firing's batch happened to be the last one needed today.
    await markRanAutomaticallyToday(admin, todayWarsaw)
    await sendDailyDigestIfDue(admin, todayWarsaw, runDate)
  }
  // stillPending === null (couldn't re-check) just means we don't know yet
  // whether today is done — same reasoning as the pre-batch check above;
  // the next firing re-derives this from scratch, nothing to lose here.
  return result
}

// A manual "Run now" was previously only guarded client-side (the button
// disables itself while loading) — nothing stopped multiple browser tabs or
// a repeated raw POST from re-triggering it. Each run burns ~20 GA4 Data
// API calls against that property's own shared daily quota, so a spammed
// button could exhaust a client's GA4 quota and knock out their own
// automatic daily check too. 60s is generous for legitimate re-runs (e.g.
// right after fixing a config) while blocking rapid-fire clicking.
const RUN_NOW_COOLDOWN_MS = 60_000

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
    const { data: project } = await admin.from('projects').select('owner_id, ga4_property_id, last_manual_run_at').eq('id', projectId).single()
    if (!user || !project || !(await getAccessibleOwnerIds(user.id)).includes(project.owner_id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // The PROJECT'S owner's plan/trial gates this, not the clicking user's
    // own — a team member has no plan of their own at all, so checking
    // user.id here would reject every manual run from a member even while
    // the Agency account they belong to is fully active.
    if (!(await ownerHasActiveAccess(project.owner_id))) {
      return NextResponse.json({ error: TRIAL_EXPIRED_MESSAGE }, { status: 402 })
    }
    // Team membership alone doesn't mean Google granted this person access
    // to the property itself — don't let a member burn this project's GA4
    // API quota for data they wouldn't be allowed to read back anyway.
    if (project.owner_id !== user.id && !(await memberHasAccessToProperty(user.id, project.ga4_property_id))) {
      return NextResponse.json({ error: NO_GA4_ACCESS_MESSAGE }, { status: 403 })
    }

    if (project.last_manual_run_at) {
      const elapsedMs = Date.now() - new Date(project.last_manual_run_at).getTime()
      if (elapsedMs < RUN_NOW_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RUN_NOW_COOLDOWN_MS - elapsedMs) / 1000)
        return NextResponse.json({ error: `Please wait ${waitSeconds}s before running again`, waitSeconds }, { status: 429 })
      }
    }
    // Recorded before the run itself so two near-simultaneous requests (two
    // tabs, a double click) both see the updated timestamp rather than
    // racing through on the old one. Best-effort only — a failure here must
    // never block the actual run, just like every other gate in this file.
    const { error: markError } = await admin.from('projects').update({ last_manual_run_at: new Date().toISOString() }).eq('id', projectId)
    if (markError) console.error('[worker] Could not record last_manual_run_at (non-fatal, cooldown just won\'t apply this time):', markError.message)

    return runWorker([projectId], false)
  }

  // Cron-authenticated POST with no project_id — the emergency "run
  // everything right now" path the watchdog's own alert email tells the
  // account owner to use when the rolling window missed the day entirely.
  // Unlike the GET rolling batches, this always takes every auto_run
  // project in one go (ignoring today's pending/done split, since the
  // point is a full manual catch-up), then feeds the same digest
  // machinery as the automatic path so a manually-recovered day still
  // gets exactly one summary email.
  if (!projectId) {
    const admin = createAdminClient()
    const { data: allAutoRun } = await admin.from('projects').select('id').eq('status', 'active').eq('auto_run', true)
    const ids = (allAutoRun ?? []).map((p: { id: string }) => p.id)
    const result = await runWorker(ids, true)
    const todayWarsaw = currentWarsawDate()
    await markRanAutomaticallyToday(admin, todayWarsaw)
    await sendDailyDigestIfDue(admin, todayWarsaw, new Date().toISOString().split('T')[0])
    return result
  }

  return runWorker([projectId], false)
}

// projectIds — the exact projects to process this call: a single id for a
// manual "Run now" or the emergency full catch-up, or a bounded batch for
// one rolling-window firing (see GET above). isAutoRunPass only affects
// processProject's own behavior (e.g. the reconnect-notice email) — it does
// NOT drive the owner digest anymore, that's handled entirely by the
// caller via sendDailyDigestIfDue once it knows today's work is complete.
async function runWorker(projectIds: string[], isAutoRunPass: boolean) {
  const supabase = createAdminClient()
  const runDate = new Date().toISOString().split('T')[0]
  // The actual GA4 date every check in this run covers — always 2 days
  // before the run, not "today"/"yesterday" (see getDailyRanges()). Passed
  // through to the alert emails so they state which day's data they
  // reflect instead of implying it's yesterday's traffic.
  const checkedDate = getDailyRanges().current.startDate

  const { data: projectsRaw } = projectIds.length
    ? await supabase.from('projects').select('*').eq('status', 'active').in('id', projectIds)
    : { data: [] as Project[] }

  // A lapsed trial (or no plan at all) used to only block creating NEW
  // projects — existing ones kept running daily checks and sending client
  // alerts forever, for free. Batched (not one query per project) since a
  // single call can cover dozens of projects at once. Projects with no
  // owner_id (a legacy/system-owned property, see getGa4Token below) aren't
  // tied to any billed account, so they're exempt rather than blocked.
  const allProjects = (projectsRaw ?? []) as Project[]
  const ownerIds = [...new Set(allProjects.map(p => p.owner_id).filter((id): id is string => !!id))]
  const { data: ownerProfiles, error: ownerProfilesError } = ownerIds.length
    ? await supabase.from('profiles').select('id, plan_id, trial_ends_at').in('id', ownerIds)
    : { data: [] as { id: string; plan_id: string | null; trial_ends_at: string | null }[], error: null }
  if (ownerProfilesError) {
    // Fail OPEN, not closed: this lookup errorring must never translate
    // into "treat every project as having no access" — that would silently
    // stop every client's checks and alerts off the back of an unrelated,
    // transient query failure, which is a far worse outcome than letting a
    // lapsed-trial project slip through for one run.
    console.error('[worker] Owner profile lookup failed — not filtering any project by plan status this run:', ownerProfilesError.message)
  }
  const accessByOwner = new Map((ownerProfiles ?? []).map((p: { id: string; plan_id: string | null; trial_ends_at: string | null }) => [p.id, hasActiveAccess(p.plan_id, p.trial_ends_at)]))
  const projects = ownerProfilesError
    ? allProjects
    : allProjects.filter(p => !p.owner_id || accessByOwner.get(p.owner_id) === true)
  const skippedNoAccess = ownerProfilesError
    ? []
    : allProjects.filter(p => p.owner_id && accessByOwner.get(p.owner_id) !== true)

  const processed: string[] = []
  const errors: Record<string, string> = {}

  const prevDateObj = new Date(runDate)
  prevDateObj.setDate(prevDateObj.getDate() - 1)
  const prevDate = prevDateObj.toISOString().split('T')[0]

  const outcomes = await runWithConcurrency(
    projects,
    WORKER_CONCURRENCY,
    project => processProject(supabase, project, runDate, prevDate, isAutoRunPass, checkedDate)
  )

  for (const outcome of outcomes) {
    if (!outcome) continue
    if (outcome.processed) processed.push(outcome.projectId)
    if (outcome.errorMessage) errors[outcome.projectId] = outcome.errorMessage
  }

  return NextResponse.json({ ok: true, processed, errors, run_date: runDate, skipped_no_access: skippedNoAccess.map(p => p.id) })
}
