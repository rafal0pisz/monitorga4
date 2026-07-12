import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report as ga4Post } from '@/lib/ga4/report'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Period = 1 | 7 | 14 | 30
type Status = 'pass' | 'warn' | 'check'

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

// Single-period row helpers
const m0  = (row: any) => parseFloat(row?.metricValues?.[0]?.value ?? '0')
const mi  = (row: any, i: number) => parseFloat(row?.metricValues?.[i]?.value ?? '0')
const dim = (row: any) => row?.dimensionValues?.[0]?.value as string ?? ''

function rowsByDim(rows: any[]): Record<string, any> {
  const map: Record<string, any> = {}
  for (const r of rows ?? []) map[dim(r)] = r
  return map
}

const r1   = (n: number) => Math.round(n * 10) / 10
const sign = (n: number) => n >= 0 ? '+' : ''
const ppΔ  = (c: number, p: number) => r1(c - p)
const pctΔ = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round((c - p) / Math.abs(p) * 100)

function stAbove(v: number, w: number, f: number): Status { return v >= f ? 'check' : v >= w ? 'warn' : 'pass' }
function stDelta(d: number, w: number, f: number): Status  { const a = Math.abs(d); return a >= f ? 'check' : a >= w ? 'warn' : 'pass' }
function stBelow(v: number, w: number, f: number): Status  { return v >= w ? 'pass' : v >= f ? 'warn' : 'check' }

export async function POST(req: NextRequest) {
  const body      = await req.json().catch(() => ({}))
  const period    = (Number(body.period) as Period) || 7
  const projectId = body.projectId as string | undefined

  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('ga4_property_id, owner_id')
    .eq('id', projectId)
    .single()

  // 404, not 403 — don't confirm to the caller that a project id they
  // don't own exists at all.
  if (!project || project.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const propertyId = project.ga4_property_id
  const token = await getGa4Token()
  if (!token) return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const { current, prev, label } = buildRanges(period)

  const ENG_METRICS = [
    { name: 'bounceRate' },               // 0
    { name: 'engagementRate' },            // 1
    { name: 'screenPageViewsPerSession' }, // 2
    { name: 'averageSessionDuration' },    // 3
    { name: 'sessions' },                  // 4
    { name: 'newUsers' },                  // 5
    { name: 'totalUsers' },               // 6
  ]

  try {
    // 6 separate calls — one period per call, no ambiguity
    const [chC, chP, engC, engP, coC, coP] = await Promise.all([

      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics:    [{ name: 'sessions' }], limit: 50,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics:    [{ name: 'sessions' }], limit: 50,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [current],
        metrics: ENG_METRICS,
      }).then(d => (d.rows ?? [])[0] ?? null),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        metrics: ENG_METRICS,
      }).then(d => (d.rows ?? [])[0] ?? null),

      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'country' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'country' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),
    ])

    const checks: CheckResult[] = [
      ...trafficChecks(chC, chP, label),
      ...engagementChecks(engC, engP, label),
      ...usersChecks(coC, coP, engC, engP, chC),
    ]

    return NextResponse.json({ checks, comparisonLabel: label })
  } catch (err: any) {
    console.error('[/api/ga4/checks]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── TRAFFIC ─────────────────────────────────────────────────────────────────

function trafficChecks(chC: any[], chP: any[], label: string): CheckResult[] {
  const mapC = rowsByDim(chC)
  const mapP = rowsByDim(chP)

  const totC = chC.reduce((s, r) => s + m0(r), 0)
  const totP = chP.reduce((s, r) => s + m0(r), 0)

  const shC = (ch: string) => totC > 0 ? m0(mapC[ch]) / totC * 100 : 0
  const shP = (ch: string) => totP > 0 ? m0(mapP[ch]) / totP * 100 : 0

  const channels = [...new Set([...Object.keys(mapC), ...Object.keys(mapP)])]

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
      description: 'Sessions without an assigned channel — indicates missing UTM parameters or broken tracking.',
      status: stAbove(notSetC, 2, 5),
      valueLabel: `${r1(notSetC)}%`, prevLabel: `${r1(notSetP)}%`,
      deltaLabel: `${sign(notSetΔ)}${notSetΔ}pp`,
    },
    {
      id: 'direct_shift', section: 'traffic',
      label: 'Direct channel shift',
      description: `Change in Direct traffic share ${label} — spikes often signal missing UTMs, email/app dark traffic, or HTTPS stripping.`,
      status: stDelta(dirΔ, 15, 30),
      valueLabel: `${r1(dirC)}%`, prevLabel: `${r1(dirP)}%`,
      deltaLabel: `${sign(dirΔ)}${dirΔ}pp`,
    },
    {
      id: 'organic_shift', section: 'traffic',
      label: 'Organic Search shift',
      description: `Change in Organic Search share ${label} — drops may indicate a Google penalty or indexing issues.`,
      status: stDelta(orgΔ, 20, 35),
      valueLabel: `${r1(orgC)}%`, prevLabel: `${r1(orgP)}%`,
      deltaLabel: `${sign(orgΔ)}${orgΔ}pp`,
    },
    {
      id: 'all_channels_shift', section: 'traffic',
      label: 'Channel distribution shift',
      description: `Largest single-channel share change ${label} — flags unusual shifts in the attribution mix.`,
      status: stDelta(maxShift.δ, 20, 35),
      valueLabel: `${Math.abs(maxShift.δ)}pp max`,
      prevLabel: '',
      deltaLabel: maxShift.c ? `${maxShift.c}: ${sign(maxShift.δ)}${maxShift.δ}pp` : '—',
      detail: maxShift.c ? `Largest: ${maxShift.c}` : undefined,
    },
  ]
}

// ─── ENGAGEMENT ───────────────────────────────────────────────────────────────

function engagementChecks(engC: any, engP: any, label: string): CheckResult[] {
  const gC = (i: number) => mi(engC, i)
  const gP = (i: number) => mi(engP, i)

  const bounceC = gC(0) * 100; const bounceP = gP(0) * 100
  const engRC   = gC(1) * 100; const engRP   = gP(1) * 100
  const ppsC    = gC(2);       const ppsP    = gP(2)
  const durC    = gC(3);       const durP    = gP(3)

  const bounceΔ = ppΔ(bounceC, bounceP)
  const engRΔ   = ppΔ(engRC, engRP)
  const ppsΔ    = pctΔ(ppsC, ppsP)
  const durΔ    = pctΔ(durC, durP)

  return [
    {
      id: 'bounce_rate', section: 'engagement',
      label: 'Bounce rate shift',
      description: `Change in bounce rate ${label} — a spike may indicate a broken page or misconfigured engagement events.`,
      status: stDelta(bounceΔ, 10, 20),
      valueLabel: `${r1(bounceC)}%`, prevLabel: `${r1(bounceP)}%`,
      deltaLabel: `${sign(bounceΔ)}${bounceΔ}pp`,
    },
    {
      id: 'engagement_rate', section: 'engagement',
      label: 'Engagement rate',
      description: 'Share of sessions lasting 10+ seconds or triggering a conversion — below 20% suggests bot traffic or broken tracking.',
      status: stBelow(engRC, 40, 20),
      valueLabel: `${r1(engRC)}%`, prevLabel: `${r1(engRP)}%`,
      deltaLabel: `${sign(engRΔ)}${engRΔ}pp`,
    },
    {
      id: 'pages_per_session', section: 'engagement',
      label: 'Pages / session shift',
      description: `Change in pages per session ${label} — a drop may indicate broken navigation or redirect loops.`,
      status: stDelta(ppsΔ, 20, 40),
      valueLabel: ppsC.toFixed(2), prevLabel: ppsP.toFixed(2),
      deltaLabel: `${sign(ppsΔ)}${ppsΔ}%`,
    },
    {
      id: 'session_duration', section: 'engagement',
      label: 'Session duration shift',
      description: `Change in average session duration ${label} — drops can indicate bot traffic or UX degradation.`,
      status: stDelta(durΔ, 25, 40),
      valueLabel: `${Math.round(durC)}s`, prevLabel: `${Math.round(durP)}s`,
      deltaLabel: `${sign(durΔ)}${durΔ}%`,
    },
  ]
}

// ─── USERS ───────────────────────────────────────────────────────────────────

function usersChecks(coC: any[], coP: any[], engC: any, engP: any, chC: any[]): CheckResult[] {
  const mapCoC = rowsByDim(coC)
  const mapCoP = rowsByDim(coP)
  const totCC  = coC.reduce((s, r) => s + m0(r), 0)
  const totCP  = coP.reduce((s, r) => s + m0(r), 0)

  const csC = (c: string) => totCC > 0 ? m0(mapCoC[c]) / totCC * 100 : 0
  const csP = (c: string) => totCP > 0 ? m0(mapCoP[c]) / totCP * 100 : 0

  const unkC = csC('(not set)'); const unkP = csP('(not set)')
  const unkΔ = ppΔ(unkC, unkP)

  const countries = [...new Set([...Object.keys(mapCoC), ...Object.keys(mapCoP)])].filter(c => c !== '(not set)')
  const maxGeo = countries
    .map(c => ({ c, δ: ppΔ(csC(c), csP(c)) }))
    .reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  // Bot signals — current period
  const newUsersC   = mi(engC, 5)
  const totalUsrsC  = mi(engC, 6)
  const engRateC    = mi(engC, 1) * 100
  const avgDurC     = mi(engC, 3)
  const newUserPct  = totalUsrsC > 0 ? newUsersC / totalUsrsC * 100 : 0

  const mapChC  = rowsByDim(chC)
  const chTotC  = chC.reduce((s, r) => s + m0(r), 0)
  const chShC   = (ch: string) => chTotC > 0 ? m0(mapChC[ch]) / chTotC * 100 : 0

  const signals = [
    { label: 'New users > 97%',          triggered: newUserPct > 97 },
    { label: 'Engagement rate < 15%',    triggered: engRateC   < 15 },
    { label: 'Avg session < 5 seconds',  triggered: avgDurC    < 5  },
    { label: 'Direct + (not set) > 78%', triggered: (chShC('Direct') + chShC('(not set)')) > 78 },
  ]
  const botScore  = signals.filter(s => s.triggered).length
  const triggered = signals.filter(s => s.triggered).map(s => s.label)
  const botStatus: Status = botScore >= 3 ? 'check' : botScore >= 2 ? 'warn' : 'pass'

  return [
    {
      id: 'unknown_country', section: 'users',
      label: 'Unknown country share',
      description: 'Sessions without an assigned country — elevated values may indicate VPN traffic or bot activity.',
      status: stAbove(unkC, 2, 5),
      valueLabel: `${r1(unkC)}%`, prevLabel: `${r1(unkP)}%`,
      deltaLabel: `${sign(unkΔ)}${unkΔ}pp`,
    },
    {
      id: 'geo_spike', section: 'users',
      label: 'Geographic spike',
      description: 'Flags any country whose session share jumped 15+ pp vs the previous period — a strong bot signal.',
      status: Math.abs(maxGeo.δ) >= 15 ? 'check' : Math.abs(maxGeo.δ) >= 8 ? 'warn' : 'pass',
      valueLabel: maxGeo.c ? `${Math.abs(maxGeo.δ)}pp max` : 'No data',
      prevLabel: '',
      deltaLabel: maxGeo.c ? `${maxGeo.c}: ${sign(maxGeo.δ)}${maxGeo.δ}pp` : '—',
      detail: maxGeo.c ? `Largest: ${maxGeo.c}` : undefined,
    },
    {
      id: 'bot_suspicion', section: 'users',
      label: 'Bot Suspicion Index',
      description: 'Combines 4 signals (new-user ratio, engagement rate, session length, direct share) into a risk score.',
      status: botStatus,
      valueLabel: `${botScore}/4 signals`,
      prevLabel: '',
      deltaLabel: botScore === 0 ? 'All clear' : triggered[0] ?? '',
      detail: triggered.length ? triggered.join(' · ') : 'No signals triggered',
    },
  ]
}
