import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'

export const runtime = 'nodejs'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Period = 1 | 7 | 14 | 30
type Status = 'pass' | 'warn' | 'fail'
type Section = 'traffic' | 'engagement' | 'users'

export interface CheckResult {
  id: string
  section: Section
  label: string
  description: string
  status: Status
  valueLabel: string   // e.g. "3.2%"
  prevLabel: string    // e.g. "1.1%"
  deltaLabel: string   // e.g. "+2.1pp" or "+35%"
  detail?: string      // extra context line
  chart: {
    labels: string[]
    current: number[]
    prev: number[]     // empty array = no prev bars (bot index)
  }
}

interface GA4Range { startDate: string; endDate: string; name: string }
interface Ranges { current: GA4Range; prev: GA4Range; label: string }

// ─── DATE RANGES ─────────────────────────────────────────────────────────────

function fmt(d: Date) { return d.toISOString().split('T')[0] }

function buildRanges(period: Period): Ranges {
  const today = new Date()

  if (period === 1) {
    // Yesterday vs same weekday last week
    const yday = new Date(today); yday.setDate(today.getDate() - 1)
    const lwk  = new Date(today); lwk.setDate(today.getDate() - 8)
    return {
      current: { startDate: fmt(yday), endDate: fmt(yday), name: 'current' },
      prev:    { startDate: fmt(lwk),  endDate: fmt(lwk),  name: 'prev'    },
      label:   'vs same day last week',
    }
  }

  const endC   = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC);  startC.setDate(endC.getDate() - period + 1)
  const endP   = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP);  startP.setDate(endP.getDate() - period + 1)

  return {
    current: { startDate: fmt(startC), endDate: fmt(endC), name: 'current' },
    prev:    { startDate: fmt(startP), endDate: fmt(endP), name: 'prev'    },
    label:   `vs prev ${period}d`,
  }
}

// ─── GA4 FETCH HELPER ────────────────────────────────────────────────────────

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

// ─── ROW HELPERS ─────────────────────────────────────────────────────────────

/** Get metric value from rows with 2 dimensions (d0, d1) */
function rv2(rows: any[], d0: string, d1: string, mi = 0): number {
  const r = rows?.find((x: any) =>
    x.dimensionValues?.[0]?.value === d0 && x.dimensionValues?.[1]?.value === d1
  )
  return parseFloat(r?.metricValues?.[mi]?.value ?? '0')
}

/** Get metric value from rows with 1 dimension (d0) */
function rv1(rows: any[], d0: string, mi = 0): number {
  const r = rows?.find((x: any) => x.dimensionValues?.[0]?.value === d0)
  return parseFloat(r?.metricValues?.[mi]?.value ?? '0')
}

/** Sum all metric values for a given d1 value (period) */
function sumPeriod(rows: any[], d1: string, mi = 0): number {
  return (rows ?? [])
    .filter((x: any) => x.dimensionValues?.[1]?.value === d1)
    .reduce((s: number, x: any) => s + parseFloat(x.metricValues?.[mi]?.value ?? '0'), 0)
}

/** Unique values of first dimension */
function dim0s(rows: any[]): string[] {
  return [...new Set((rows ?? []).map((x: any) => x.dimensionValues?.[0]?.value as string))]
}

// ─── MATH HELPERS ────────────────────────────────────────────────────────────

const r1 = (n: number) => Math.round(n * 10) / 10

function ppDelta(curr: number, prev: number) { return r1(curr - prev) }
function pctDelta(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / Math.abs(prev)) * 100)
}

function sign(n: number) { return n >= 0 ? '+' : '' }

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────

/** Fail if |delta| ≥ failAt, warn if ≥ warnAt (for pp / pct deltas) */
function stDelta(delta: number, warnAt: number, failAt: number): Status {
  const a = Math.abs(delta)
  return a >= failAt ? 'fail' : a >= warnAt ? 'warn' : 'pass'
}

/** Fail if value ≥ failAt, warn if ≥ warnAt (e.g. (not set) share — lower is better) */
function stAbove(value: number, warnAt: number, failAt: number): Status {
  return value >= failAt ? 'fail' : value >= warnAt ? 'warn' : 'pass'
}

/** Fail if value < failAt, warn if < warnAt (e.g. engagement rate — higher is better) */
function stBelow(value: number, warnAt: number, failAt: number): Status {
  return value >= warnAt ? 'pass' : value >= failAt ? 'warn' : 'fail'
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const period  = (Number(body.period)  as Period) || 7
  const propertyId = body.propertyId as string | undefined

  if (!propertyId) {
    return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 })
  }

  const token = await getGa4Token()
  if (!token) {
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })
  }

  const ranges = buildRanges(period)
  const dr = [ranges.current, ranges.prev]

  try {
    const [channelRows, engTotals, engByDay, countryRows] = await Promise.all([

      // 1. Channel distribution: sessionDefaultChannelGroup × dateRange
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'dateRange' }],
        metrics:    [{ name: 'sessions' }],
        limit: 50,
      }).then((d: any) => d.rows ?? []),

      // 2. Engagement totals: dateRange only
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'dateRange' }],
        metrics: [
          { name: 'bounceRate' },              // [0]
          { name: 'engagementRate' },           // [1]
          { name: 'screenPageViewsPerSession' },// [2]
          { name: 'averageSessionDuration' },   // [3]
          { name: 'sessions' },                 // [4]
          { name: 'newUsers' },                 // [5]
          { name: 'totalUsers' },               // [6]
        ],
      }).then((d: any) => d.rows ?? []),

      // 3. Engagement by day: date × dateRange (for trend charts)
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'date' }, { name: 'dateRange' }],
        metrics: [
          { name: 'bounceRate' },               // [0]
          { name: 'engagementRate' },            // [1]
          { name: 'screenPageViewsPerSession' }, // [2]
          { name: 'averageSessionDuration' },    // [3]
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 200,
      }).then((d: any) => d.rows ?? []),

      // 4. Country distribution: country × dateRange
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'country' }, { name: 'dateRange' }],
        metrics:    [{ name: 'sessions' }],
        limit: 100,
      }).then((d: any) => d.rows ?? []),

    ])

    const checks: CheckResult[] = [
      ...trafficChecks(channelRows, ranges.label),
      ...engagementChecks(engTotals, engByDay, ranges.label),
      ...usersChecks(countryRows, engTotals, channelRows, ranges.label),
    ]

    return NextResponse.json({ checks, comparisonLabel: ranges.label })
  } catch (err: any) {
    console.error('[/api/ga4/checks]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── TRAFFIC CHECKS ──────────────────────────────────────────────────────────

function trafficChecks(rows: any[], compLabel: string): CheckResult[] {
  const channels = dim0s(rows)

  const totalC = channels.reduce((s, c) => s + rv2(rows, c, 'current'), 0)
  const totalP = channels.reduce((s, c) => s + rv2(rows, c, 'prev'),    0)

  const shareC = (ch: string) => totalC > 0 ? rv2(rows, ch, 'current') / totalC * 100 : 0
  const shareP = (ch: string) => totalP > 0 ? rv2(rows, ch, 'prev')    / totalP * 100 : 0

  // (not set) share
  const notSetC = shareC('(not set)'); const notSetP = shareP('(not set)')
  const notSetΔ = ppDelta(notSetC, notSetP)

  // Direct shift
  const dirC = shareC('Direct'); const dirP = shareP('Direct')
  const dirΔ = ppDelta(dirC, dirP)

  // Organic shift
  const orgC = shareC('Organic Search'); const orgP = shareP('Organic Search')
  const orgΔ = ppDelta(orgC, orgP)

  // All-channel max shift
  const allDeltas = channels.map(c => ({ c, δ: ppDelta(shareC(c), shareP(c)) }))
  const maxShift  = allDeltas.reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  // Channel breakdown chart (all channels)
  const visChannels = channels.filter(c => c !== '(not set)').slice(0, 8)
  const channelChart = {
    labels:  visChannels,
    current: visChannels.map(c => r1(shareC(c))),
    prev:    visChannels.map(c => r1(shareP(c))),
  }

  const twoBar = (valC: number, valP: number, label: string) => ({
    labels: [label], current: [r1(valC)], prev: [r1(valP)],
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
      description: `Change in Direct traffic share ${compLabel}. A sudden spike often signals missing UTM parameters on campaigns, dark traffic from email or apps, or HTTPS→HTTP referrer stripping.`,
      status: stDelta(dirΔ, 15, 30),
      valueLabel: `${r1(dirC)}%`, prevLabel: `${r1(dirP)}%`,
      deltaLabel: `${sign(dirΔ)}${dirΔ}pp`,
      chart: twoBar(dirC, dirP, 'Direct'),
    },
    {
      id: 'organic_shift', section: 'traffic',
      label: 'Organic Search shift',
      description: `Change in Organic Search share ${compLabel}. A significant drop may indicate a Google penalty, crawling or indexing issues, or a paid campaign inflating other channels. A spike can mean a viral SEO win.`,
      status: stDelta(orgΔ, 20, 35),
      valueLabel: `${r1(orgC)}%`, prevLabel: `${r1(orgP)}%`,
      deltaLabel: `${sign(orgΔ)}${orgΔ}pp`,
      chart: twoBar(orgC, orgP, 'Organic Search'),
    },
    {
      id: 'all_channels_shift', section: 'traffic',
      label: 'Channel distribution shift',
      description: `Largest single-channel share change across all channels ${compLabel}. Large shifts in any channel can indicate campaign launch/end, tracking issues, or data quality problems across the attribution pipeline.`,
      status: stDelta(maxShift.δ, 20, 35),
      valueLabel: `${Math.abs(maxShift.δ)}pp max`,
      prevLabel: '',
      deltaLabel: maxShift.c ? `${maxShift.c}: ${sign(maxShift.δ)}${maxShift.δ}pp` : '—',
      detail: maxShift.c ? `Largest shift: ${maxShift.c}` : undefined,
      chart: channelChart,
    },
  ]
}

// ─── ENGAGEMENT CHECKS ───────────────────────────────────────────────────────

function engagementChecks(totals: any[], byDay: any[], compLabel: string): CheckResult[] {
  const get = (period: string, mi: number) => {
    const r = totals.find((x: any) => x.dimensionValues?.[0]?.value === period)
    return parseFloat(r?.metricValues?.[mi]?.value ?? '0')
  }

  const bounceC  = get('current', 0) * 100;  const bounceP  = get('prev', 0) * 100
  const engRC    = get('current', 1) * 100;  const engRP    = get('prev', 1) * 100
  const ppsC     = get('current', 2);        const ppsP     = get('prev', 2)
  const durC     = get('current', 3);        const durP     = get('prev', 3)

  const bounceΔ  = ppDelta(bounceC, bounceP)
  const engRΔ    = ppDelta(engRC,   engRP)
  const ppsΔ     = pctDelta(ppsC,   ppsP)
  const durΔ     = pctDelta(durC,   durP)

  // Day-by-day chart builder
  const dayLabels = [...new Set(byDay.map((x: any) => x.dimensionValues?.[0]?.value as string))].sort()

  function dayChart(mi: number, scale = 1) {
    return {
      labels:  dayLabels,
      current: dayLabels.map(d => {
        const x = byDay.find((r: any) => r.dimensionValues?.[0]?.value === d && r.dimensionValues?.[1]?.value === 'current')
        return r1(parseFloat(x?.metricValues?.[mi]?.value ?? '0') * scale)
      }),
      prev: dayLabels.map(d => {
        const x = byDay.find((r: any) => r.dimensionValues?.[0]?.value === d && r.dimensionValues?.[1]?.value === 'prev')
        return r1(parseFloat(x?.metricValues?.[mi]?.value ?? '0') * scale)
      }),
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
      description: 'Share of sessions that lasted 10+ seconds, triggered a conversion, or viewed 2+ pages. A property-wide rate below 20% is a strong signal of bot traffic, broken event tracking, or serious UX issues.',
      status: stBelow(engRC, 40, 20),
      valueLabel: `${r1(engRC)}%`, prevLabel: `${r1(engRP)}%`,
      deltaLabel: `${sign(engRΔ)}${engRΔ}pp`,
      chart: dayChart(1, 100),
    },
    {
      id: 'pages_per_session', section: 'engagement',
      label: 'Pages / session shift',
      description: `Change in average pages per session ${compLabel}. A drop of 20%+ may indicate broken navigation, redirect loops, or removal of key pages. Can also reflect a deliberate site restructuring.`,
      status: stDelta(ppsΔ, 20, 40),
      valueLabel: `${ppsC.toFixed(2)}`, prevLabel: `${ppsP.toFixed(2)}`,
      deltaLabel: `${sign(ppsΔ)}${ppsΔ}%`,
      chart: dayChart(2),
    },
    {
      id: 'session_duration', section: 'engagement',
      label: 'Session duration shift',
      description: `Change in average session duration ${compLabel}. A drop of 25%+ can indicate an influx of bot traffic, broken engagement tracking, or major UX degradation pushing users away faster.`,
      status: stDelta(durΔ, 25, 40),
      valueLabel: `${Math.round(durC)}s`, prevLabel: `${Math.round(durP)}s`,
      deltaLabel: `${sign(durΔ)}${durΔ}%`,
      chart: dayChart(3),
    },
  ]
}

// ─── USERS CHECKS ────────────────────────────────────────────────────────────

function usersChecks(countryRows: any[], engTotals: any[], channelRows: any[], compLabel: string): CheckResult[] {
  const totalC = sumPeriod(countryRows, 'current')
  const totalP = sumPeriod(countryRows, 'prev')

  const cShareC = (c: string) => totalC > 0 ? rv2(countryRows, c, 'current') / totalC * 100 : 0
  const cShareP = (c: string) => totalP > 0 ? rv2(countryRows, c, 'prev')    / totalP * 100 : 0

  // 1. Unknown country share
  const unkC = cShareC('(not set)'); const unkP = cShareP('(not set)')
  const unkΔ = ppDelta(unkC, unkP)

  // 2. Geographic spike
  const countries = dim0s(countryRows).filter(c => c !== '(not set)')
  const deltas    = countries.map(c => ({ c, δ: ppDelta(cShareC(c), cShareP(c)) }))
  const maxGeo    = deltas.reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  const topCountries = countries
    .map(c => ({ c, sC: rv2(countryRows, c, 'current'), sP: rv2(countryRows, c, 'prev') }))
    .sort((a, b) => b.sC - a.sC).slice(0, 7)

  // 3. Bot Suspicion Index — 4 signals
  const get = (period: string, mi: number) => {
    const r = engTotals.find((x: any) => x.dimensionValues?.[0]?.value === period)
    return parseFloat(r?.metricValues?.[mi]?.value ?? '0')
  }
  const newUsersC   = get('current', 5)
  const totalUsersC = get('current', 6)
  const engRateC    = get('current', 1) * 100
  const avgDurC     = get('current', 3)

  // Channel signals
  const chTotalC = dim0s(channelRows).reduce((s, c) => s + rv2(channelRows, c, 'current'), 0)
  const chShare  = (c: string) => chTotalC > 0 ? rv2(channelRows, c, 'current') / chTotalC * 100 : 0
  const directPctC = chShare('Direct')
  const notSetPctC = chShare('(not set)')
  const newUserPct = totalUsersC > 0 ? newUsersC / totalUsersC * 100 : 0

  const signals = [
    { label: 'New users > 97%',           triggered: newUserPct   > 97  },
    { label: 'Engagement rate < 15%',     triggered: engRateC     < 15  },
    { label: 'Avg session duration < 5s', triggered: avgDurC      < 5   },
    { label: 'Direct + (not set) > 78%',  triggered: (directPctC + notSetPctC) > 78 },
  ]
  const botScore    = signals.filter(s => s.triggered).length
  const triggered   = signals.filter(s => s.triggered).map(s => s.label)
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
      description: `Checks whether any single country\'s session share jumped by 15+ pp ${compLabel}. A sudden spike from an unusual country is a strong signal of bot traffic, scrapers, or a viral event in an untargeted market.`,
      status: Math.abs(maxGeo.δ) >= 15 ? 'fail' : Math.abs(maxGeo.δ) >= 8 ? 'warn' : 'pass',
      valueLabel: maxGeo.c ? `${Math.abs(maxGeo.δ)}pp max` : 'No data',
      prevLabel:  '',
      deltaLabel: maxGeo.c ? `${maxGeo.c}: ${sign(maxGeo.δ)}${maxGeo.δ}pp` : '—',
      detail:     maxGeo.c ? `Largest shift: ${maxGeo.c}` : undefined,
      chart: {
        labels:  topCountries.map(x => x.c),
        current: topCountries.map(x => r1(totalC > 0 ? x.sC / totalC * 100 : 0)),
        prev:    topCountries.map(x => r1(totalP > 0 ? x.sP / totalP * 100 : 0)),
      },
    },
    {
      id: 'bot_suspicion', section: 'users',
      label: 'Bot Suspicion Index',
      description: 'Combines 4 signals: new user ratio >97%, engagement rate <15%, avg session <5s, and Direct+(not set) share >78%. Each triggered signal adds 1 point. Score 2 = suspicious, 3–4 = high bot risk.',
      status: botStatus,
      valueLabel: `${botScore}/4 signals`,
      prevLabel:  '',
      deltaLabel: botScore === 0 ? 'All clear' : triggered[0] ?? '',
      detail:     triggered.length ? triggered.join(' · ') : 'No signals triggered',
      chart: {
        labels:  signals.map(s => s.label),
        current: signals.map(s => s.triggered ? 1 : 0),
        prev:    [],
      },
    },
  ]
}
