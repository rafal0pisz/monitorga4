import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'

export const runtime = 'nodejs'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Period = 1 | 7 | 14 | 30
type Status = 'pass' | 'warn' | 'fail'

export interface CheckResult {
  id: string
  section: 'traffic' | 'engagement' | 'users'
  label: string
  description: string
  status: Status
  valueLabel: string
  prevLabel: string
  deltaLabel: string
  detail?: string
  chart: { labels: string[]; current: number[]; prev: number[] }
}

interface GA4Range { startDate: string; endDate: string; name?: string }
interface Ranges { current: GA4Range; prev: GA4Range; label: string }

// ─── DATE RANGES ─────────────────────────────────────────────────────────────

const fmt = (d: Date) => d.toISOString().split('T')[0]

function buildRanges(period: Period): Ranges {
  const today = new Date()
  if (period === 1) {
    const yday = new Date(today); yday.setDate(today.getDate() - 1)
    const lwk  = new Date(today); lwk.setDate(today.getDate() - 8)
    return {
      current: { startDate: fmt(yday), endDate: fmt(yday) },
      prev:    { startDate: fmt(lwk),  endDate: fmt(lwk)  },
      label:   'vs same day last week',
    }
  }
  const endC   = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC);  startC.setDate(endC.getDate() - period + 1)
  const endP   = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP);  startP.setDate(endP.getDate() - period + 1)
  return {
    current: { startDate: fmt(startC), endDate: fmt(endC) },
    prev:    { startDate: fmt(startP), endDate: fmt(endP) },
    label:   `vs prev ${period}d`,
  }
}

// ─── GA4 HELPER ──────────────────────────────────────────────────────────────

async function ga4Post(propertyId: string, token: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(`GA4 ${res.status}: ${e.error?.message ?? res.statusText}`)
  }
  return res.json()
}

// ─── RESPONSE PARSING ────────────────────────────────────────────────────────
//
// When GA4 runReport receives N dateRanges with M metrics and no `dateRange` dimension,
// it returns rows where metricValues has N*M entries, ordered as:
//   [metric0_range0, metric1_range0, ..., metricM_range0,
//    metric0_range1, metric1_range1, ..., metricM_range1, ...]
//
// So for 2 dateRanges with M metrics:
//   metricValues[i]   = metric i for dateRange[0] (current)
//   metricValues[M+i] = metric i for dateRange[1] (prev)

/** Get metric from a row that has 2 dateRanges. metricCount = total # metrics in request. */
function mVal(row: any, metricIdx: number, metricCount: number, period: 'current' | 'prev'): number {
  const offset = period === 'current' ? 0 : metricCount
  return parseFloat(row?.metricValues?.[metricIdx + offset]?.value ?? '0')
}

/** Find a row by its first dimension value, return metric for given period. */
function findM(rows: any[], dim0: string, metricIdx: number, metricCount: number, period: 'current' | 'prev'): number {
  const row = rows?.find((r: any) => r.dimensionValues?.[0]?.value === dim0)
  return row ? mVal(row, metricIdx, metricCount, period) : 0
}

/** Sum all rows for a given period (first metric, index 0). */
function sumRows(rows: any[], metricCount: number, period: 'current' | 'prev'): number {
  return (rows ?? []).reduce((s: number, r: any) => s + mVal(r, 0, metricCount, period), 0)
}

const r1   = (n: number) => Math.round(n * 10) / 10
const sign = (n: number) => n >= 0 ? '+' : ''
const ppDelta  = (c: number, p: number) => r1(c - p)
const pctDelta = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round((c - p) / Math.abs(p) * 100)

type ST = Status
function stAbove(v: number, w: number, f: number): ST { return v >= f ? 'fail' : v >= w ? 'warn' : 'pass' }
function stDelta(d: number, w: number, f: number): ST  { const a = Math.abs(d); return a >= f ? 'fail' : a >= w ? 'warn' : 'pass' }
function stBelow(v: number, w: number, f: number): ST  { return v >= w ? 'pass' : v >= f ? 'warn' : 'fail' }

// ─── ROUTE ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body       = await req.json().catch(() => ({}))
  const period     = (Number(body.period) as Period) || 7
  const propertyId = body.propertyId as string | undefined

  if (!propertyId) return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 })

  const token = await getGa4Token()
  if (!token) return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const { current, prev, label } = buildRanges(period)
  const dr = [current, prev]   // 2 dateRanges — NO dateRange dimension needed

  try {
    // 5 parallel calls. Key: dateRange is NOT in dimensions.
    // Multiple dateRanges → metricValues automatically doubled per row.
    const [channelRows, engRow, countryRows, engDayC, engDayP] = await Promise.all([

      // 1. Channel distribution — 1 metric × 2 ranges
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        limit: 50,
      }).then((d: any) => d.rows ?? []),

      // 2. Engagement totals — 7 metrics × 2 ranges, NO dimensions → single aggregate row
      ga4Post(propertyId, token, {
        dateRanges: dr,
        metrics: [
          { name: 'bounceRate' },               // idx 0
          { name: 'engagementRate' },            // idx 1
          { name: 'screenPageViewsPerSession' }, // idx 2
          { name: 'averageSessionDuration' },    // idx 3
          { name: 'sessions' },                  // idx 4
          { name: 'newUsers' },                  // idx 5
          { name: 'totalUsers' },                // idx 6
        ],
      }).then((d: any) => (d.rows ?? [])[0] ?? null),

      // 3. Country distribution — 1 metric × 2 ranges
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'sessions' }],
        limit: 100,
      }).then((d: any) => d.rows ?? []),

      // 4. Engagement by day — current period only (separate call — dates differ between periods)
      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'bounceRate' },
          { name: 'engagementRate' },
          { name: 'screenPageViewsPerSession' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 200,
      }).then((d: any) => d.rows ?? []),

      // 5. Engagement by day — prev period only
      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'bounceRate' },
          { name: 'engagementRate' },
          { name: 'screenPageViewsPerSession' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 200,
      }).then((d: any) => d.rows ?? []),
    ])

    const checks: CheckResult[] = [
      ...trafficChecks(channelRows, label),
      ...engagementChecks(engRow, engDayC, engDayP, label),
      ...usersChecks(countryRows, engRow, channelRows, label),
    ]

    return NextResponse.json({ checks, comparisonLabel: label })

  } catch (err: any) {
    console.error('[/api/ga4/checks]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── TRAFFIC ─────────────────────────────────────────────────────────────────

function trafficChecks(rows: any[], compLabel: string): CheckResult[] {
  const M = 1  // 1 metric (sessions) in this call

  const channels = [...new Set((rows ?? []).map((r: any) => r.dimensionValues?.[0]?.value as string))]

  const sesC = (ch: string) => findM(rows, ch, 0, M, 'current')
  const sesP = (ch: string) => findM(rows, ch, 0, M, 'prev')

  const totC = channels.reduce((s, c) => s + sesC(c), 0)
  const totP = channels.reduce((s, c) => s + sesP(c), 0)

  const shC = (ch: string) => totC > 0 ? sesC(ch) / totC * 100 : 0
  const shP = (ch: string) => totP > 0 ? sesP(ch) / totP * 100 : 0

  const notSetC = shC('(not set)');       const notSetP = shP('(not set)')
  const dirC    = shC('Direct');          const dirP    = shP('Direct')
  const orgC    = shC('Organic Search');  const orgP    = shP('Organic Search')

  const notSetΔ = ppDelta(notSetC, notSetP)
  const dirΔ    = ppDelta(dirC,    dirP)
  const orgΔ    = ppDelta(orgC,    orgP)

  const allΔs   = channels.map(c => ({ c, δ: ppDelta(shC(c), shP(c)) }))
  const maxShift = allΔs.reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  const visChannels = channels.filter(c => c !== '(not set)').slice(0, 8)

  const twoBar = (vC: number, vP: number, lbl: string) => ({
    labels: [lbl], current: [r1(vC)], prev: [r1(vP)],
  })

  return [
    {
      id: 'not_set_share', section: 'traffic',
      label: '(not set) share',
      description: 'Sessions without an assigned channel group. Values above 2% typically indicate missing UTM parameters, broken referral exclusions, or cross-domain tracking gaps.',
      status: stAbove(notSetC, 2, 5),
      valueLabel: `${r1(notSetC)}%`, prevLabel: `${r1(notSetP)}%`,
      deltaLabel: `${sign(notSetΔ)}${notSetΔ}pp`,
      chart: twoBar(notSetC, notSetP, '(not set)'),
    },
    {
      id: 'direct_shift', section: 'traffic',
      label: 'Direct channel shift',
      description: `Change in Direct traffic share ${compLabel}. A sudden spike often signals missing UTM parameters, dark traffic from email or apps, or HTTPS→HTTP referrer stripping.`,
      status: stDelta(dirΔ, 15, 30),
      valueLabel: `${r1(dirC)}%`, prevLabel: `${r1(dirP)}%`,
      deltaLabel: `${sign(dirΔ)}${dirΔ}pp`,
      chart: twoBar(dirC, dirP, 'Direct'),
    },
    {
      id: 'organic_shift', section: 'traffic',
      label: 'Organic Search shift',
      description: `Change in Organic Search share ${compLabel}. A significant drop may indicate a Google penalty, indexing issues, or a paid campaign inflating other channels.`,
      status: stDelta(orgΔ, 20, 35),
      valueLabel: `${r1(orgC)}%`, prevLabel: `${r1(orgP)}%`,
      deltaLabel: `${sign(orgΔ)}${orgΔ}pp`,
      chart: twoBar(orgC, orgP, 'Organic Search'),
    },
    {
      id: 'all_channels_shift', section: 'traffic',
      label: 'Channel distribution shift',
      description: `Largest single-channel share change across all channels ${compLabel}. Large shifts in any channel can indicate campaign changes, tracking issues, or attribution problems.`,
      status: stDelta(maxShift.δ, 20, 35),
      valueLabel: `${Math.abs(maxShift.δ)}pp max`,
      prevLabel: '',
      deltaLabel: maxShift.c ? `${maxShift.c}: ${sign(maxShift.δ)}${maxShift.δ}pp` : '—',
      detail: maxShift.c ? `Largest shift: ${maxShift.c}` : undefined,
      chart: {
        labels:  visChannels,
        current: visChannels.map(c => r1(shC(c))),
        prev:    visChannels.map(c => r1(shP(c))),
      },
    },
  ]
}

// ─── ENGAGEMENT ───────────────────────────────────────────────────────────────

function engagementChecks(engRow: any, dayC: any[], dayP: any[], compLabel: string): CheckResult[] {
  const M = 7  // 7 metrics in the engagement call

  const g = (mi: number, period: 'current' | 'prev') => engRow ? mVal(engRow, mi, M, period) : 0

  const bounceC = g(0, 'current') * 100;  const bounceP = g(0, 'prev') * 100
  const engRC   = g(1, 'current') * 100;  const engRP   = g(1, 'prev') * 100
  const ppsC    = g(2, 'current');         const ppsP    = g(2, 'prev')
  const durC    = g(3, 'current');         const durP    = g(3, 'prev')

  const bounceΔ = ppDelta(bounceC, bounceP)
  const engRΔ   = ppDelta(engRC,   engRP)
  const ppsΔ    = pctDelta(ppsC,   ppsP)
  const durΔ    = pctDelta(durC,   durP)

  // Day-by-day charts: align by day index (day 0 = first day of period)
  const dayCount = Math.max(dayC.length, dayP.length)
  const dayLabels = Array.from({ length: dayCount }, (_, i) => `D${i + 1}`)

  function dayChart(mi: number, scale = 1) {
    return {
      labels:  dayLabels,
      current: dayC.map(r => r1(parseFloat(r.metricValues?.[mi]?.value ?? '0') * scale)),
      prev:    dayP.map(r => r1(parseFloat(r.metricValues?.[mi]?.value ?? '0') * scale)),
    }
  }

  return [
    {
      id: 'bounce_rate', section: 'engagement',
      label: 'Bounce rate shift',
      description: `Change in bounce rate ${compLabel}. A spike of 10+ pp often indicates a broken landing page, sudden traffic quality drop, or a misconfigured GA4 event that stops sessions from being counted as engaged.`,
      status: stDelta(bounceΔ, 10, 20),
      valueLabel: `${r1(bounceC)}%`, prevLabel: `${r1(bounceP)}%`,
      deltaLabel: `${sign(bounceΔ)}${bounceΔ}pp`,
      chart: dayChart(0, 100),
    },
    {
      id: 'engagement_rate', section: 'engagement',
      label: 'Engagement rate',
      description: 'Share of sessions that lasted 10+ seconds, triggered a conversion, or viewed 2+ pages. A property-wide rate below 20% is a strong signal of bot traffic, broken tracking, or serious UX issues.',
      status: stBelow(engRC, 40, 20),
      valueLabel: `${r1(engRC)}%`, prevLabel: `${r1(engRP)}%`,
      deltaLabel: `${sign(engRΔ)}${engRΔ}pp`,
      chart: dayChart(1, 100),
    },
    {
      id: 'pages_per_session', section: 'engagement',
      label: 'Pages / session shift',
      description: `Change in average pages per session ${compLabel}. A drop of 20%+ may indicate broken navigation, redirect loops, or loss of key pages from the sitemap.`,
      status: stDelta(ppsΔ, 20, 40),
      valueLabel: ppsC.toFixed(2), prevLabel: ppsP.toFixed(2),
      deltaLabel: `${sign(ppsΔ)}${ppsΔ}%`,
      chart: dayChart(2),
    },
    {
      id: 'session_duration', section: 'engagement',
      label: 'Session duration shift',
      description: `Change in average session duration ${compLabel}. A drop of 25%+ can indicate bot traffic influx, broken engagement tracking, or major UX degradation pushing users away faster.`,
      status: stDelta(durΔ, 25, 40),
      valueLabel: `${Math.round(durC)}s`, prevLabel: `${Math.round(durP)}s`,
      deltaLabel: `${sign(durΔ)}${durΔ}%`,
      chart: dayChart(3),
    },
  ]
}

// ─── USERS ───────────────────────────────────────────────────────────────────

function usersChecks(countryRows: any[], engRow: any, channelRows: any[], compLabel: string): CheckResult[] {
  const CM = 1  // 1 metric in country call
  const EM = 7  // 7 metrics in engagement call
  const ChM = 1 // 1 metric in channel call

  const totC = (countryRows ?? []).reduce((s: number, r: any) => s + mVal(r, 0, CM, 'current'), 0)
  const totP = (countryRows ?? []).reduce((s: number, r: any) => s + mVal(r, 0, CM, 'prev'),    0)

  const csC = (c: string) => totC > 0 ? findM(countryRows, c, 0, CM, 'current') / totC * 100 : 0
  const csP = (c: string) => totP > 0 ? findM(countryRows, c, 0, CM, 'prev')    / totP * 100 : 0

  // 1. Unknown country
  const unkC = csC('(not set)'); const unkP = csP('(not set)')
  const unkΔ = ppDelta(unkC, unkP)

  // 2. Geo spike
  const countries = [...new Set((countryRows ?? []).map((r: any) => r.dimensionValues?.[0]?.value as string))]
    .filter(c => c !== '(not set)')
  const deltas    = countries.map(c => ({ c, δ: ppDelta(csC(c), csP(c)) }))
  const maxGeo    = deltas.reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  const topCountries = countries
    .map(c => ({ c, sC: findM(countryRows, c, 0, CM, 'current'), sP: findM(countryRows, c, 0, CM, 'prev') }))
    .sort((a, b) => b.sC - a.sC).slice(0, 6)

  // 3. Bot Suspicion Index
  const g = (mi: number, period: 'current' | 'prev') => engRow ? mVal(engRow, mi, EM, period) : 0
  const newUsersC   = g(5, 'current')
  const totalUsrsC  = g(6, 'current')
  const engRateC    = g(1, 'current') * 100
  const avgDurC     = g(3, 'current')
  const newUserPct  = totalUsrsC > 0 ? newUsersC / totalUsrsC * 100 : 0

  const chTotC = (channelRows ?? []).reduce((s: number, r: any) => s + mVal(r, 0, ChM, 'current'), 0)
  const chSh   = (c: string) => chTotC > 0 ? findM(channelRows, c, 0, ChM, 'current') / chTotC * 100 : 0
  const directPct = chSh('Direct')
  const notSetPct = chSh('(not set)')

  const signals = [
    { label: 'New users > 97%',           triggered: newUserPct > 97 },
    { label: 'Engagement rate < 15%',     triggered: engRateC   < 15 },
    { label: 'Avg session < 5 seconds',   triggered: avgDurC    < 5  },
    { label: 'Direct + (not set) > 78%',  triggered: (directPct + notSetPct) > 78 },
  ]
  const botScore  = signals.filter(s => s.triggered).length
  const triggered = signals.filter(s => s.triggered).map(s => s.label)
  const botStatus: Status = botScore >= 3 ? 'fail' : botScore >= 2 ? 'warn' : 'pass'

  return [
    {
      id: 'unknown_country', section: 'users',
      label: 'Unknown country share',
      description: 'Sessions without an assigned country. Consistent values above 2% can indicate VPN or proxy traffic, bot activity, or geo-IP resolution issues in GA4.',
      status: stAbove(unkC, 2, 5),
      valueLabel: `${r1(unkC)}%`, prevLabel: `${r1(unkP)}%`,
      deltaLabel: `${sign(unkΔ)}${unkΔ}pp`,
      chart: { labels: ['(not set)'], current: [r1(unkC)], prev: [r1(unkP)] },
    },
    {
      id: 'geo_spike', section: 'users',
      label: 'Geographic spike',
      description: `Checks if any country's session share jumped 15+ pp ${compLabel}. A sudden spike from an unusual country is a strong bot or scraper signal.`,
      status: Math.abs(maxGeo.δ) >= 15 ? 'fail' : Math.abs(maxGeo.δ) >= 8 ? 'warn' : 'pass',
      valueLabel: maxGeo.c ? `${Math.abs(maxGeo.δ)}pp max` : 'No data',
      prevLabel: '',
      deltaLabel: maxGeo.c ? `${maxGeo.c}: ${sign(maxGeo.δ)}${maxGeo.δ}pp` : '—',
      detail: maxGeo.c ? `Largest: ${maxGeo.c}` : undefined,
      chart: {
        labels:  topCountries.map(x => x.c),
        current: topCountries.map(x => r1(totC > 0 ? x.sC / totC * 100 : 0)),
        prev:    topCountries.map(x => r1(totP > 0 ? x.sP / totP * 100 : 0)),
      },
    },
    {
      id: 'bot_suspicion', section: 'users',
      label: 'Bot Suspicion Index',
      description: 'Combines 4 signals: new user ratio >97%, engagement rate <15%, avg session <5s, Direct+(not set) share >78%. Each triggered signal adds 1 point. Score 2 = suspicious, 3–4 = high bot risk.',
      status: botStatus,
      valueLabel: `${botScore}/4 signals`,
      prevLabel: '',
      deltaLabel: botScore === 0 ? 'All clear' : triggered[0] ?? '',
      detail: triggered.length ? triggered.join(' · ') : 'No signals triggered',
      chart: {
        labels:  signals.map(s => s.label),
        current: signals.map(s => s.triggered ? 1 : 0),
        prev:    [],
      },
    },
  ]
}
