import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report as ga4Post } from '@/lib/ga4/report'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Period = 1 | 7 | 14 | 30
type Status = 'pass' | 'warn' | 'check' | 'skip'

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

// anchorOffset shifts the whole window back by extra days (0 = end
// yesterday, 1 = end 2 days ago) — an escape hatch for when yesterday's
// GA4 data is still processing and would otherwise look like a false
// anomaly in the checks below.
function buildRanges(period: Period, anchorOffset: number): Ranges {
  const today = new Date()
  if (period === 1) {
    const yday = new Date(today); yday.setDate(today.getDate() - 1 - anchorOffset)
    const lwk  = new Date(today); lwk.setDate(today.getDate() - 8 - anchorOffset)
    return {
      current: { startDate: fmt(yday), endDate: fmt(yday) },
      prev:    { startDate: fmt(lwk),  endDate: fmt(lwk)  },
      label: 'vs same day last week',
    }
  }
  const endC   = new Date(today); endC.setDate(today.getDate() - 1 - anchorOffset)
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
const r2   = (n: number) => Math.round(n * 100) / 100
const sign = (n: number) => n >= 0 ? '+' : ''
const ppΔ  = (c: number, p: number) => r1(c - p)
const pctΔ = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round((c - p) / Math.abs(p) * 100)

function stAbove(v: number, w: number, f: number): Status { return v >= f ? 'check' : v >= w ? 'warn' : 'pass' }
function stDelta(d: number, w: number, f: number): Status  { const a = Math.abs(d); return a >= f ? 'check' : a >= w ? 'warn' : 'pass' }
function stBelow(v: number, w: number, f: number): Status  { return v >= w ? 'pass' : v >= f ? 'warn' : 'check' }

export async function POST(req: NextRequest) {
  const body      = await req.json().catch(() => ({}))
  const period    = (Number(body.period) as Period) || 7
  const anchorOffset = Number(body.anchorOffset) === 1 ? 1 : 0
  const projectId = body.projectId as string | undefined

  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('ga4_property_id, owner_id, own_domain')
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

  const { current, prev, label } = buildRanges(period, anchorOffset)

  const ENG_METRICS = [
    { name: 'bounceRate' },               // 0
    { name: 'engagementRate' },            // 1
    { name: 'screenPageViewsPerSession' }, // 2
    { name: 'averageSessionDuration' },    // 3
    { name: 'sessions' },                  // 4
    { name: 'newUsers' },                  // 5
    { name: 'totalUsers' },               // 6
    { name: 'conversions' },              // 7
  ]

  try {
    // 14 separate calls — one period per call, no ambiguity
    const [chC, chP, smC, smP, engC, engP, coC, coP, hostC, hostP, ptC, ptP, hrC, hrP] = await Promise.all([

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

      // Raw sessionSource/sessionMedium — used for the (not set)/Direct-None/
      // Organic Search/Google Ads share checks below instead of GA4's own
      // sessionDefaultChannelGroup, per an explicit decision to verify these
      // against the actual source/medium pair rather than Google's channel
      // grouping rules (which can shift and don't expose the raw values).
      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics:    [{ name: 'sessions' }], limit: 200,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics:    [{ name: 'sessions' }], limit: 200,
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

      // hostName — the actual domain a hit was collected on. Used to catch
      // a brand-new domain/subdomain sending real traffic that wasn't
      // there in the previous period (a stolen/cloned tag, a forgotten
      // staging/dev domain going live, a misconfigured cross-domain setup).
      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'hostName' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'hostName' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),

      // pageTitle — used for the "Page title coverage" check (missing/blank
      // page titles hurt readability of Behavior reports).
      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'pageTitle' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'pageTitle' }],
        metrics:    [{ name: 'sessions' }], limit: 100,
      }).then(d => d.rows ?? []),

      // hour — used for the "Night traffic spike" bot-signal check.
      ga4Post(propertyId, token, {
        dateRanges: [current],
        dimensions: [{ name: 'hour' }],
        metrics:    [{ name: 'sessions' }], limit: 24,
      }).then(d => d.rows ?? []),

      ga4Post(propertyId, token, {
        dateRanges: [prev],
        dimensions: [{ name: 'hour' }],
        metrics:    [{ name: 'sessions' }], limit: 24,
      }).then(d => d.rows ?? []),
    ])

    const checks: CheckResult[] = [
      selfReferralCheck(smC, smP, project.own_domain, label),
      directTrafficSpikeCheck(smC, smP, label),
      ...trafficShareChecks(smC, smP, label),
      channelDistributionShift(chC, chP, label),
      newHostnameCheck(hostC, hostP, label),
      ...engagementChecks(engC, engP, label),
      conversionRateCheck(engC, engP, label),
      pageTitleNullCheck(ptC, ptP, label),
      geoAnomalyCheck(coC, coP, label),
      ...usersChecks(coC, coP, engC, engP, chC),
      botTrafficNightCheck(hrC, hrP, label),
    ]

    return NextResponse.json({ checks, comparisonLabel: label })
  } catch (err: any) {
    console.error('[/api/ga4/checks]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── TRAFFIC ─────────────────────────────────────────────────────────────────

interface SMRow { source: string; medium: string; sessions: number }

function toSMRows(rows: any[]): SMRow[] {
  return (rows ?? []).map(r => ({
    source: r.dimensionValues?.[0]?.value ?? '',
    medium: r.dimensionValues?.[1]?.value ?? '',
    sessions: m0(r),
  }))
}

// Derived from the same sessionSource/sessionMedium rows as
// trafficShareChecks below (summed across all mediums for a given source,
// same as the worker's own single-dimension sessionSource query) — no
// extra GA4 call needed. Uses the worker's own thresholds (absolute
// share, not a delta) so this reads identically to the stored daily
// version, just live/Period-reactive instead of frozen at yesterday.
function selfReferralCheck(smC: any[], smP: any[], ownDomain: string | null | undefined, label: string): CheckResult {
  const description = 'Share of sessions where your own domain shows up as the referrer — a sign of broken cross-domain or UTM tracking.'
  if (!ownDomain) {
    return {
      id: 'self_referral', section: 'traffic',
      label: 'Self-referral',
      description,
      status: 'skip',
      valueLabel: 'Not configured', prevLabel: '', deltaLabel: '',
    }
  }
  const rowsC = toSMRows(smC)
  const rowsP = toSMRows(smP)
  const totC = rowsC.reduce((s, r) => s + r.sessions, 0)
  const totP = rowsP.reduce((s, r) => s + r.sessions, 0)
  const selfC = rowsC.filter(r => r.source.includes(ownDomain)).reduce((s, r) => s + r.sessions, 0)
  const selfP = rowsP.filter(r => r.source.includes(ownDomain)).reduce((s, r) => s + r.sessions, 0)
  const ratioC = totC > 0 ? selfC / totC * 100 : 0
  const ratioP = totP > 0 ? selfP / totP * 100 : 0
  const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
  return {
    id: 'self_referral', section: 'traffic',
    label: 'Self-referral',
    description,
    status: ratioC === 0 ? 'pass' : ratioC < 2 ? 'warn' : 'check',
    valueLabel: `${r2(ratioC)}%`, prevLabel: `${r2(ratioP)}%`,
    deltaLabel: ratioC === 0 ? 'All clear' : `${sign(r1(delta))}${r1(delta)}%`,
  }
}

function shareOf(rows: SMRow[], total: number, predicate: (r: SMRow) => boolean): number {
  if (total <= 0) return 0
  return rows.filter(predicate).reduce((s, r) => s + r.sessions, 0) / total * 100
}

// Google's own auto-tagging always writes exactly source=google/medium=cpc,
// but some accounts also see paid-Google traffic labeled ppc/paid (manual
// UTMs, older setups) — matching all three catches those without also
// catching organic (medium=organic is handled separately below).
const GOOGLE_ADS_MEDIUMS = new Set(['cpc', 'ppc', 'paid'])

// Verified against raw sessionSource/sessionMedium rather than GA4's own
// sessionDefaultChannelGroup — channel grouping is a moving target Google
// controls and doesn't expose the underlying source/medium pair, so these
// shares are computed directly instead. Numbers will differ from the old
// channel-group-based version; that's an intentional, accepted tradeoff.
function trafficShareChecks(smC: any[], smP: any[], label: string): CheckResult[] {
  const rowsC = toSMRows(smC)
  const rowsP = toSMRows(smP)
  const totC  = rowsC.reduce((s, r) => s + r.sessions, 0)
  const totP  = rowsP.reduce((s, r) => s + r.sessions, 0)

  const isNotSet     = (r: SMRow) => r.source === '(not set)' || r.medium === '(not set)'
  const isDirectNone = (r: SMRow) => r.source === '(direct)' && r.medium === '(none)'
  const isOrganic    = (r: SMRow) => r.medium === 'organic'
  const isGoogleAds  = (r: SMRow) => r.source === 'google' && GOOGLE_ADS_MEDIUMS.has(r.medium.toLowerCase())

  const notSetC = shareOf(rowsC, totC, isNotSet);     const notSetP = shareOf(rowsP, totP, isNotSet)
  const dirC    = shareOf(rowsC, totC, isDirectNone); const dirP    = shareOf(rowsP, totP, isDirectNone)
  const orgC    = shareOf(rowsC, totC, isOrganic);    const orgP    = shareOf(rowsP, totP, isOrganic)
  const adsC    = shareOf(rowsC, totC, isGoogleAds);  const adsP    = shareOf(rowsP, totP, isGoogleAds)

  const notSetΔ = ppΔ(notSetC, notSetP)
  const dirΔ    = ppΔ(dirC, dirP)
  const orgΔ    = ppΔ(orgC, orgP)
  const adsΔ    = ppΔ(adsC, adsP)
  const totΔ    = pctΔ(totC, totP)

  return [
    {
      id: 'total_sessions', section: 'traffic',
      label: 'Sessions',
      description: `Total sessions ${label} — a large drop can signal broken tracking or real traffic loss; a large spike may indicate bot traffic.`,
      status: stDelta(totΔ, 20, 40),
      valueLabel: totC.toLocaleString('en'), prevLabel: totP.toLocaleString('en'),
      deltaLabel: `${sign(totΔ)}${totΔ}%`,
    },
    {
      id: 'not_set_share', section: 'traffic',
      label: '(not set) share',
      description: 'Sessions where source or medium is (not set) — indicates missing UTM parameters or broken tracking.',
      status: stAbove(notSetC, 2, 5),
      valueLabel: `${r1(notSetC)}%`, prevLabel: `${r1(notSetP)}%`,
      deltaLabel: `${sign(notSetΔ)}${notSetΔ}pp`,
    },
    {
      id: 'direct_none_share', section: 'traffic',
      label: 'Direct/None share',
      description: `Change in (direct)/(none) traffic share ${label} — spikes often signal missing UTMs, email/app dark traffic, or HTTPS stripping.`,
      status: stDelta(dirΔ, 15, 30),
      valueLabel: `${r1(dirC)}%`, prevLabel: `${r1(dirP)}%`,
      deltaLabel: `${sign(dirΔ)}${dirΔ}pp`,
    },
    {
      id: 'organic_search_share', section: 'traffic',
      label: 'Organic Search share',
      description: `Change in Organic Search (medium=organic) traffic share ${label} — drops may indicate a Google penalty or indexing issues.`,
      status: stDelta(orgΔ, 20, 35),
      valueLabel: `${r1(orgC)}%`, prevLabel: `${r1(orgP)}%`,
      deltaLabel: `${sign(orgΔ)}${orgΔ}pp`,
    },
    {
      id: 'google_ads_share', section: 'traffic',
      label: 'Google Ads share',
      description: `Change in Google Ads (google/cpc) traffic share ${label}.`,
      status: stDelta(adsΔ, 20, 35),
      valueLabel: `${r1(adsC)}%`, prevLabel: `${r1(adsP)}%`,
      deltaLabel: `${sign(adsΔ)}${adsΔ}pp`,
    },
  ]
}

// Mirrors the worker's stored direct_traffic_spike check exactly — same
// filter (medium=(none), regardless of source — broader than
// direct_none_share's stricter source=(direct)+medium=(none) combo above),
// same relative-% delta, same 15/30 thresholds, same one-directional check
// (only a rise counts, a drop is always 'pass'). A different, real
// discrepancy between this and direct_none_share previously let the live
// panel show 100% pass while the worker's own (different) formula still
// failed and dragged the stored score down.
function directTrafficSpikeCheck(smC: any[], smP: any[], label: string): CheckResult {
  const rowsC = toSMRows(smC)
  const rowsP = toSMRows(smP)
  const totC = rowsC.reduce((s, r) => s + r.sessions, 0)
  const totP = rowsP.reduce((s, r) => s + r.sessions, 0)
  const directC = rowsC.filter(r => r.medium === '(none)').reduce((s, r) => s + r.sessions, 0)
  const directP = rowsP.filter(r => r.medium === '(none)').reduce((s, r) => s + r.sessions, 0)
  const ratioC = totC > 0 ? directC / totC * 100 : 0
  const ratioP = totP > 0 ? directP / totP * 100 : 0
  const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
  return {
    id: 'direct_traffic_spike', section: 'traffic',
    label: 'Direct traffic spike',
    description: `Change in Direct (medium=none) traffic share ${label} — spikes often signal missing UTM parameters or dark traffic.`,
    status: delta <= 15 ? 'pass' : delta <= 30 ? 'warn' : 'check',
    valueLabel: `${r1(ratioC)}%`, prevLabel: `${r1(ratioP)}%`,
    deltaLabel: `${sign(r1(delta))}${r1(delta)}%`,
  }
}

// Kept on sessionDefaultChannelGroup — this check is about the largest
// shift across the WHOLE channel mix, which is exactly what channel
// grouping is for, unlike the single-bucket share checks above.
function channelDistributionShift(chC: any[], chP: any[], label: string): CheckResult {
  const mapC = rowsByDim(chC)
  const mapP = rowsByDim(chP)

  const totC = chC.reduce((s, r) => s + m0(r), 0)
  const totP = chP.reduce((s, r) => s + m0(r), 0)

  const shC = (ch: string) => totC > 0 ? m0(mapC[ch]) / totC * 100 : 0
  const shP = (ch: string) => totP > 0 ? m0(mapP[ch]) / totP * 100 : 0

  const channels = [...new Set([...Object.keys(mapC), ...Object.keys(mapP)])]

  const maxShift = channels
    .map(c => ({ c, δ: ppΔ(shC(c), shP(c)) }))
    .reduce((m, x) => Math.abs(x.δ) > Math.abs(m.δ) ? x : m, { c: '', δ: 0 })

  return {
    id: 'all_channels_shift', section: 'traffic',
    label: 'Channel distribution shift',
    description: `Largest single-channel share change ${label} — flags unusual shifts in the attribution mix.`,
    status: stDelta(maxShift.δ, 20, 35),
    valueLabel: `${Math.abs(maxShift.δ)}pp max`,
    prevLabel: '',
    deltaLabel: maxShift.c ? `${maxShift.c}: ${sign(maxShift.δ)}${maxShift.δ}pp` : '—',
    detail: maxShift.c ? `Largest: ${maxShift.c}` : undefined,
  }
}

// Sessions this new hostname needs in the current period before it's
// flagged — filters out one-off test/dev hits so this only fires on
// genuinely new, meaningful traffic (a hijacked/cloned tag, a forgotten
// staging domain going live, a broken cross-domain setup), not noise.
const NEW_HOSTNAME_MIN_SESSIONS = 100

function newHostnameCheck(hostC: any[], hostP: any[], label: string): CheckResult {
  const prevHosts = new Set(hostP.map(dim))
  const newHosts = hostC
    .filter(r => !prevHosts.has(dim(r)) && m0(r) >= NEW_HOSTNAME_MIN_SESSIONS)
    .map(r => ({ host: dim(r), sessions: m0(r) }))
    .sort((a, b) => b.sessions - a.sessions)

  return {
    id: 'new_hostname', section: 'traffic',
    label: 'New hostname',
    description: `Flags any hostname with ${NEW_HOSTNAME_MIN_SESSIONS}+ sessions ${label} that wasn't seen in the previous period — a sign of a hijacked/cloned tag, a staging/dev domain going live, or a broken cross-domain setup.`,
    status: newHosts.length === 0 ? 'pass' : 'check',
    valueLabel: newHosts.length === 0 ? 'None' : `${newHosts.length} new`,
    prevLabel: '',
    deltaLabel: newHosts.length === 0 ? 'All clear' : newHosts.map(h => h.host).join(', '),
    detail: newHosts.length > 0 ? newHosts.map(h => `${h.host}: ${h.sessions.toLocaleString('en')} sessions`).join(' · ') : undefined,
  }
}

// ─── ENGAGEMENT ───────────────────────────────────────────────────────────────

function engagementChecks(engC: any, engP: any, label: string): CheckResult[] {
  const gC = (i: number) => mi(engC, i)
  const gP = (i: number) => mi(engP, i)

  const bounceC = gC(0) * 100; const bounceP = gP(0) * 100
  const engRC   = gC(1) * 100; const engRP   = gP(1) * 100
  const ppsC    = gC(2);       const ppsP    = gP(2)
  const durC    = gC(3);       const durP    = gP(3)

  // Relative % change, not a pp delta — matches the worker's stored
  // bounce_rate_anomaly exactly (thresholds 20/35, same formula). This
  // used to be pp-based with different (10/20) thresholds, a leftover
  // from before this was meant to mirror the stored check — the two
  // disagreeing meant the live panel could show 100% pass while the
  // stored score (which the worker's own formula still drives) did not.
  const bounceRelΔ = pctΔ(bounceC, bounceP)
  const engRΔ   = ppΔ(engRC, engRP)
  const ppsΔ    = pctΔ(ppsC, ppsP)
  const durΔ    = pctΔ(durC, durP)

  return [
    {
      id: 'bounce_rate', section: 'engagement',
      label: 'Bounce rate shift',
      description: `Change in bounce rate ${label} — a spike may indicate a broken page or misconfigured engagement events.`,
      status: stDelta(bounceRelΔ, 20, 35),
      valueLabel: `${r1(bounceC)}%`, prevLabel: `${r1(bounceP)}%`,
      deltaLabel: `${sign(bounceRelΔ)}${bounceRelΔ}%`,
    },
    {
      id: 'engagement_rate', section: 'engagement',
      label: 'Engagement rate',
      description: 'Share of sessions lasting 10+ seconds or triggering a conversion — below 20% suggests bot traffic or broken tracking.'
        + (engRC > 75 ? ' Note: above 75% can be artificially inflated — check your Engagement Rate / engaged-session settings in GA4.' : ''),
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

// Reuses the same combined metrics-only query as engagementChecks above
// (index 4 = sessions, 7 = conversions) — no extra GA4 call needed.
// Thresholds match the worker's stored daily version exactly.
function conversionRateCheck(engC: any, engP: any, label: string): CheckResult {
  const sessC = mi(engC, 4), convC = mi(engC, 7)
  const sessP = mi(engP, 4), convP = mi(engP, 7)
  const crC = sessC > 0 ? convC / sessC * 100 : 0
  const crP = sessP > 0 ? convP / sessP * 100 : 0
  const delta = crP > 0 ? ((crC - crP) / crP) * 100 : 0
  return {
    id: 'conversion_rate', section: 'engagement',
    label: 'Conversion rate',
    description: `Change in session conversion rate ${label}.`,
    status: stDelta(delta, 25, 40),
    valueLabel: `${r2(crC)}%`, prevLabel: `${r2(crP)}%`,
    deltaLabel: `${sign(r1(delta))}${r1(delta)}%`,
  }
}

// pageTitle rows: a missing/blank title comes back as either no dimension
// value at all or the literal "(not set)". Status is an absolute-value
// threshold (not a delta) — same as the worker's stored version.
function pageTitleNullCheck(ptC: any[], ptP: any[], label: string): CheckResult {
  const isNullTitle = (r: any) => !dim(r) || dim(r) === '(not set)'
  const totalC = ptC.reduce((s, r) => s + m0(r), 0)
  const totalP = ptP.reduce((s, r) => s + m0(r), 0)
  const nullC = ptC.filter(isNullTitle).reduce((s, r) => s + m0(r), 0)
  const nullP = ptP.filter(isNullTitle).reduce((s, r) => s + m0(r), 0)
  const ratioC = totalC > 0 ? nullC / totalC * 100 : 0
  const ratioP = totalP > 0 ? nullP / totalP * 100 : 0
  const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
  return {
    id: 'page_title_null', section: 'engagement',
    label: 'Page title coverage',
    description: 'Share of sessions with a missing or blank page title.',
    status: ratioC < 2 ? 'pass' : ratioC < 10 ? 'warn' : 'check',
    valueLabel: `${r2(ratioC)}%`, prevLabel: `${r2(ratioP)}%`,
    deltaLabel: ratioC === 0 ? 'All clear' : `${sign(r1(delta))}${r1(delta)}%`,
  }
}

// ─── USERS ───────────────────────────────────────────────────────────────────

// Mirrors the worker's stored geo_anomaly check exactly: which countries
// are new to the Top 5 by sessions, not how much any single country's
// share shifted (that's geo_spike below — a different, complementary
// signal, not a duplicate of this one). coC/coP aren't pre-sorted here
// (unlike the worker's own ordered+limited query), so this sorts and
// takes the top 5 itself to get the same set.
function geoAnomalyCheck(coC: any[], coP: any[], label: string): CheckResult {
  const top5 = (rows: any[]) => new Set([...rows].sort((a, b) => m0(b) - m0(a)).slice(0, 5).map(dim))
  const top5C = top5(coC)
  const top5P = top5(coP)
  const newCountries = [...top5C].filter(c => !top5P.has(c))
  return {
    id: 'geo_anomaly', section: 'users',
    label: 'Geographic anomaly',
    description: `New countries entering the Top 5 by sessions ${label}.`,
    status: newCountries.length === 0 ? 'pass' : newCountries.length === 1 ? 'warn' : 'check',
    valueLabel: newCountries.length === 0 ? 'No change' : `${newCountries.length} new`,
    prevLabel: '',
    deltaLabel: newCountries.length === 0 ? 'All clear' : newCountries.join(', '),
    detail: newCountries.length > 0 ? `New: ${newCountries.join(', ')}` : undefined,
  }
}

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

// Night-time (0–5h) traffic share — a common bot signal (real visitors
// cluster around normal waking hours; bots don't). Only a rise is treated
// as a problem — a drop in night share is never itself suspicious — same
// as the worker's stored version.
const NIGHT_HOURS = new Set(['0', '1', '2', '3', '4', '5'])

function botTrafficNightCheck(hrC: any[], hrP: any[], label: string): CheckResult {
  const totalC = hrC.reduce((s, r) => s + m0(r), 0)
  const totalP = hrP.reduce((s, r) => s + m0(r), 0)
  const nightC = hrC.filter(r => NIGHT_HOURS.has(dim(r))).reduce((s, r) => s + m0(r), 0)
  const nightP = hrP.filter(r => NIGHT_HOURS.has(dim(r))).reduce((s, r) => s + m0(r), 0)
  const ratioC = totalC > 0 ? nightC / totalC * 100 : 0
  const ratioP = totalP > 0 ? nightP / totalP * 100 : 0
  const delta = ratioP > 0 ? ((ratioC - ratioP) / ratioP) * 100 : 0
  return {
    id: 'bot_traffic_night', section: 'users',
    label: 'Night traffic spike',
    description: `Change in night-time (0–5h) traffic share ${label} — a common bot signal.`,
    status: delta <= 50 ? 'pass' : delta <= 100 ? 'warn' : 'check',
    valueLabel: `${r1(ratioC)}%`, prevLabel: `${r1(ratioP)}%`,
    deltaLabel: ratioC === 0 ? 'All clear' : `${sign(r1(delta))}${r1(delta)}%`,
  }
}
