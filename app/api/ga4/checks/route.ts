import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'

export const runtime = 'nodejs'

type Period = 1 | 7 | 14 | 30
type Status = 'pass' | 'warn' | 'check'   // 'check' replaces 'fail'

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
}

interface GA4Range { startDate: string; endDate: string }
interface Ranges { current: GA4Range; prev: GA4Range; label: string }

const fmt = (d: Date) => d.toISOString().split('T')[0]

function buildRanges(period: Period): Ranges {
  const today = new Date()
  if (period === 1) {
    const yday = new Date(today); yday.setDate(today.getDate() - 1)
    const lwk  = new Date(today); lwk.setDate(today.getDate() - 8)
    return {
      current: { startDate: fmt(yday), endDate: fmt(yday) },
      prev:    { startDate: fmt(lwk),  endDate: fmt(lwk)  },
      label: 'vs same day last week',
    }
  }
  const endC   = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC);  startC.setDate(endC.getDate() - period + 1)
  const endP   = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP);  startP.setDate(endP.getDate() - period + 1)
  return {
    current: { startDate: fmt(startC), endDate: fmt(endC) },
    prev:    { startDate: fmt(startP), endDate: fmt(endP) },
    label: `vs prev ${period}d`,
  }
}

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

// ─── PARSING ─────────────────────────────────────────────────────────────────
//
// With N metrics and 2 dateRanges (no dateRange dimension), GA4 returns:
//   metricValues = [m0_range0, m1_range0, ..., mN_range0, m0_range1, ..., mN_range1]
//
// So: current = metricValues[i], prev = metricValues[N + i]

function mv(row: any, metricIdx: number, numMetrics: number, period: 'current' | 'prev'): number {
  const offset = period === 'current' ? 0 : numMetrics
  return parseFloat(row?.metricValues?.[metricIdx + offset]?.value ?? '0')
}

function findRow(rows: any[], dim0: string) {
  return rows?.find((r: any) => r.dimensionValues?.[0]?.value === dim0)
}

function dimVal(row: any, dimIdx = 0): string {
  return row?.dimensionValues?.[dimIdx]?.value ?? ''
}

function uniqDim0(rows: any[]): string[] {
  return [...new Set((rows ?? []).map((r: any) => dimVal(r, 0)))]
}

const r1   = (n: number) => Math.round(n * 10) / 10
const sign = (n: number) => n >= 0 ? '+' : ''
const ppΔ  = (c: number, p: number) => r1(c - p)
const pctΔ = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round((c - p) / Math.abs(p) * 100)

function stAbove(v: number, w: number, f: number): Status { return v >= f ? 'check' : v >= w ? 'warn' : 'pass' }
function stDelta(d: number, w: number, f: number): Status  { const a = Math.abs(d); return a >= f ? 'check' : a >= w ? 'warn' : 'pass' }
function stBelow(v: number, w: number, f: number): Status  { return v >= w ? 'pass' : v >= f ? 'warn' : 'check' }

// ─── ROUTE ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body       = await req.json().catch(() => ({}))
  const period     = (Number(body.period) as Period) || 7
  const propertyId = body.propertyId as string | undefined

  if (!propertyId) return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 })

  const token = await getGa4Token()
  if (!token) return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const { current, prev, label } = buildRanges(period)
  const dr = [current, prev]

  try {
    // 3 parallel calls — NO dateRange dimension anywhere
    const [channelRows, engRow, countryRows] = await Promise.all([

      // 1. Channel distribution — 1 metric × 2 dateRanges
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        limit: 50,
      }).then((d: any) => d.rows ?? []),

      // 2. Engagement totals — 7 metrics × 2 dateRanges, no dimensions → single row
      ga4Post(propertyId, token, {
        dateRanges: dr,
        metrics: [
          { name: 'bounceRate' },               // 0
          { name: 'engagementRate' },            // 1
          { name: 'screenPageViewsPerSession' }, // 2
          { name: 'averageSessionDuration' },    // 3
          { name: 'sessions' },                  // 4
          { name: 'newUsers' },                  // 5
          { name: 'totalUsers' },                // 6
        ],
      }).then((d: any) => (d.rows ?? [])[0] ?? null),

      // 3. Country distribution — 1 metric × 2 dateRanges
      ga4Post(propertyId, token, {
        dateRanges: dr,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'sessions' }],
        limit: 100,
      }).then((d: any) => d.rows ?? []),
    ])

    const checks: CheckResult[] = [
      ...trafficChecks(channelRows, label),
      ...engagementChecks(engRow, label),
      ...usersChecks(countryRows, engRow, channelRows, label),
    ]

    return NextResponse.json({ checks, comparisonLabel: label })

  } catch (err: any) {
    console.error('[/api/ga4/checks]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── TRAFFIC ─────────────────────────────────────────────────────────────────

function trafficChecks(rows: any[], label: string): CheckResult[] {
  const M = 1
  const channels = uniqDim0(rows)

  const sesC = (ch: string) => mv(findRow(rows, ch), 0, M, 'current')
  const sesP = (ch: string) => mv(findRow(rows, ch), 0, M, 'prev')
  const totC = channels.reduce((s, c) => s + sesC(c), 0)
  const totP = channels.reduce((s, c) => s + sesP(c), 0)
  const shC  = (ch: string) => totC > 0 ? sesC(ch) / totC * 100 : 0
  const shP  = (ch: string) => totP > 0 ? sesP(ch) / totP * 100 : 0

  const notSetC = shC('(not set)'); const notSetP = shP('(not set)')
  const dirC    = shC('Direct');    const dirP    = shP('Direct')
  const orgC    = shC('Organic Search'); const orgP = shP('Organic Search')

  const notSetΔ = ppΔ(notSetC, notSetP)
  const dirΔ    = ppΔ(dirC, dirP)
  const orgΔ    = ppΔ(orgC, orgP)

  const maxShift = channels
    .map(c => ({ c, δ: ppΔ(shC(c), shP(c)) }))
    .reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  return [
    {
      id: 'not_set_share', section: 'traffic',
      label: '(not set) share',
      description: 'Sessions without an assigned channel group. Values above 2% typically indicate missing UTM parameters, broken referral exclusions, or cross-domain tracking gaps.',
      status: stAbove(notSetC, 2, 5),
      valueLabel: `${r1(notSetC)}%`, prevLabel: `${r1(notSetP)}%`,
      deltaLabel: `${sign(notSetΔ)}${notSetΔ}pp`,
    },
    {
      id: 'direct_shift', section: 'traffic',
      label: 'Direct channel shift',
      description: `Change in Direct traffic share ${label}. A sudden spike often signals missing UTM parameters, dark traffic from email or apps, or HTTPS→HTTP referrer stripping.`,
      status: stDelta(dirΔ, 15, 30),
      valueLabel: `${r1(dirC)}%`, prevLabel: `${r1(dirP)}%`,
      deltaLabel: `${sign(dirΔ)}${dirΔ}pp`,
    },
    {
      id: 'organic_shift', section: 'traffic',
      label: 'Organic Search shift',
      description: `Change in Organic Search share ${label}. A significant drop may indicate a Google penalty, indexing issues, or a paid campaign inflating other channels.`,
      status: stDelta(orgΔ, 20, 35),
      valueLabel: `${r1(orgC)}%`, prevLabel: `${r1(orgP)}%`,
      deltaLabel: `${sign(orgΔ)}${orgΔ}pp`,
    },
    {
      id: 'all_channels_shift', section: 'traffic',
      label: 'Channel distribution shift',
      description: `Largest single-channel share change ${label}. Large shifts in any channel can signal campaign changes, tracking issues, or attribution problems.`,
      status: stDelta(maxShift.δ, 20, 35),
      valueLabel: `${Math.abs(maxShift.δ)}pp max`,
      prevLabel: '',
      deltaLabel: maxShift.c ? `${maxShift.c}: ${sign(maxShift.δ)}${maxShift.δ}pp` : '—',
      detail: maxShift.c ? `Largest shift: ${maxShift.c}` : undefined,
    },
  ]
}

// ─── ENGAGEMENT ───────────────────────────────────────────────────────────────

function engagementChecks(engRow: any, label: string): CheckResult[] {
  const M = 7
  const g = (i: number, p: 'current' | 'prev') => mv(engRow, i, M, p)

  const bounceC = g(0, 'current') * 100; const bounceP = g(0, 'prev') * 100
  const engRC   = g(1, 'current') * 100; const engRP   = g(1, 'prev') * 100
  const ppsC    = g(2, 'current');        const ppsP    = g(2, 'prev')
  const durC    = g(3, 'current');        const durP    = g(3, 'prev')

  const bounceΔ = ppΔ(bounceC, bounceP)
  const engRΔ   = ppΔ(engRC, engRP)
  const ppsΔ    = pctΔ(ppsC, ppsP)
  const durΔ    = pctΔ(durC, durP)

  return [
    {
      id: 'bounce_rate', section: 'engagement',
      label: 'Bounce rate shift',
      description: `Change in bounce rate ${label}. A spike of 10+ pp may indicate a broken landing page, sudden traffic quality drop, or a misconfigured event stopping sessions from being counted as engaged.`,
      status: stDelta(bounceΔ, 10, 20),
      valueLabel: `${r1(bounceC)}%`, prevLabel: `${r1(bounceP)}%`,
      deltaLabel: `${sign(bounceΔ)}${bounceΔ}pp`,
    },
    {
      id: 'engagement_rate', section: 'engagement',
      label: 'Engagement rate',
      description: 'Share of sessions lasting 10+ seconds, triggering a conversion, or viewing 2+ pages. A property-wide rate below 20% is a strong signal of bot traffic, broken tracking, or serious UX issues.',
      status: stBelow(engRC, 40, 20),
      valueLabel: `${r1(engRC)}%`, prevLabel: `${r1(engRP)}%`,
      deltaLabel: `${sign(engRΔ)}${engRΔ}pp`,
    },
    {
      id: 'pages_per_session', section: 'engagement',
      label: 'Pages / session shift',
      description: `Change in average pages per session ${label}. A drop of 20%+ may indicate broken navigation, redirect loops, or removal of key pages.`,
      status: stDelta(ppsΔ, 20, 40),
      valueLabel: ppsC.toFixed(2), prevLabel: ppsP.toFixed(2),
      deltaLabel: `${sign(ppsΔ)}${ppsΔ}%`,
    },
    {
      id: 'session_duration', section: 'engagement',
      label: 'Session duration shift',
      description: `Change in average session duration ${label}. A drop of 25%+ can indicate bot traffic influx, broken engagement tracking, or major UX degradation.`,
      status: stDelta(durΔ, 25, 40),
      valueLabel: `${Math.round(durC)}s`, prevLabel: `${Math.round(durP)}s`,
      deltaLabel: `${sign(durΔ)}${durΔ}%`,
    },
  ]
}

// ─── USERS ───────────────────────────────────────────────────────────────────

function usersChecks(countryRows: any[], engRow: any, channelRows: any[], label: string): CheckResult[] {
  const CM = 1; const EM = 7; const ChM = 1

  const totC = (countryRows ?? []).reduce((s: number, r: any) => s + mv(r, 0, CM, 'current'), 0)
  const totP = (countryRows ?? []).reduce((s: number, r: any) => s + mv(r, 0, CM, 'prev'),    0)

  const csC = (c: string) => totC > 0 ? mv(findRow(countryRows, c), 0, CM, 'current') / totC * 100 : 0
  const csP = (c: string) => totP > 0 ? mv(findRow(countryRows, c), 0, CM, 'prev')    / totP * 100 : 0

  const unkC = csC('(not set)'); const unkP = csP('(not set)')
  const unkΔ = ppΔ(unkC, unkP)

  const countries = uniqDim0(countryRows).filter(c => c !== '(not set)')
  const maxGeo = countries
    .map(c => ({ c, δ: ppΔ(csC(c), csP(c)) }))
    .reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  const g     = (i: number, p: 'current' | 'prev') => mv(engRow, i, EM, p)
  const newUsersC   = g(5, 'current')
  const totalUsrsC  = g(6, 'current')
  const engRateC    = g(1, 'current') * 100
  const avgDurC     = g(3, 'current')
  const newUserPct  = totalUsrsC > 0 ? newUsersC / totalUsrsC * 100 : 0

  const chTotC = (channelRows ?? []).reduce((s: number, r: any) => s + mv(r, 0, ChM, 'current'), 0)
  const chSh   = (c: string) => chTotC > 0 ? mv(findRow(channelRows, c), 0, ChM, 'current') / chTotC * 100 : 0

  const signals = [
    { label: 'New users > 97%',          triggered: newUserPct > 97 },
    { label: 'Engagement rate < 15%',    triggered: engRateC   < 15 },
    { label: 'Avg session < 5 seconds',  triggered: avgDurC    < 5  },
    { label: 'Direct + (not set) > 78%', triggered: (chSh('Direct') + chSh('(not set)')) > 78 },
  ]
  const botScore  = signals.filter(s => s.triggered).length
  const triggered = signals.filter(s => s.triggered).map(s => s.label)
  const botStatus: Status = botScore >= 3 ? 'check' : botScore >= 2 ? 'warn' : 'pass'

  return [
    {
      id: 'unknown_country', section: 'users',
      label: 'Unknown country share',
      description: 'Sessions without an assigned country. Consistent values above 2% can indicate VPN traffic, bots, or geo-IP resolution issues in GA4.',
      status: stAbove(unkC, 2, 5),
      valueLabel: `${r1(unkC)}%`, prevLabel: `${r1(unkP)}%`,
      deltaLabel: `${sign(unkΔ)}${unkΔ}pp`,
    },
    {
      id: 'geo_spike', section: 'users',
      label: 'Geographic spike',
      description: `Checks if any country's session share jumped 15+ pp ${label}. A sudden spike from an unusual country is a strong bot or scraper signal.`,
      status: Math.abs(maxGeo.δ) >= 15 ? 'check' : Math.abs(maxGeo.δ) >= 8 ? 'warn' : 'pass',
      valueLabel: maxGeo.c ? `${Math.abs(maxGeo.δ)}pp max` : 'No data',
      prevLabel: '',
      deltaLabel: maxGeo.c ? `${maxGeo.c}: ${sign(maxGeo.δ)}${maxGeo.δ}pp` : '—',
      detail: maxGeo.c ? `Largest shift: ${maxGeo.c}` : undefined,
    },
    {
      id: 'bot_suspicion', section: 'users',
      label: 'Bot Suspicion Index',
      description: 'Combines 4 signals: new user ratio >97%, engagement rate <15%, avg session <5s, Direct+(not set) >78%. Score 2 = suspicious, 3–4 = high risk.',
      status: botStatus,
      valueLabel: `${botScore}/4 signals`,
      prevLabel: '',
      deltaLabel: botScore === 0 ? 'All clear' : triggered[0] ?? '',
      detail: triggered.length ? triggered.join(' · ') : 'No signals triggered',
    },
  ]
}
