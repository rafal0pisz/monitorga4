// Fixed, hand-written example data for the public /demo dashboard — no
// database, no GA4 call, no login. Every shape here matches the real data
// contracts (CheckResult / EventData / ParameterData / DashboardProject-ish)
// so the demo can render through the exact same presentational components
// as the real app (CheckCardShared, EventCardShared, ParameterCardShared) —
// see app/demo/project/[id]/page.tsx.
import type { CheckResult } from '@/components/project/CheckCardShared'
import type { EventData, DayCount } from '@/components/project/EventCardShared'
import type { ParameterData } from '@/components/project/ParameterCardShared'

// "Today" the demo pretends to run in — kept fixed so the page is
// deterministic (no client/server clock skew, no date drifting out of sync
// with the copy) rather than actually reacting to Date.now().
const DEMO_TODAY = new Date('2026-09-08T00:00:00Z')

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
// `days` dates ending `endOffsetDays` before DEMO_TODAY, oldest first — same
// shape GA4's date dimension returns, used for the mini bar charts.
function dateSeries(endOffsetDays: number, days: number): string[] {
  const end = new Date(DEMO_TODAY); end.setUTCDate(end.getUTCDate() - endOffsetDays)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end); d.setUTCDate(d.getUTCDate() - (days - 1 - i))
    return ymd(d)
  })
}
function toDayCounts(dates: string[], counts: number[]): DayCount[] {
  return dates.map((date, i) => ({ date, count: counts[i] ?? 0 }))
}
function sum(arr: number[]): number { return arr.reduce((s, n) => s + n, 0) }

// Matches the real project page's default: "Exclude yesterday" checked, so
// the current 7-day window ends 2 days before today.
const CURRENT_DATES = dateSeries(2, 7)
const PREV_DATES = dateSeries(9, 7)
const CURRENT_RANGE = { start: isoDate(new Date(DEMO_TODAY.getTime() - 8 * 86400000)), end: isoDate(new Date(DEMO_TODAY.getTime() - 2 * 86400000)) }
const PREV_RANGE = { start: isoDate(new Date(DEMO_TODAY.getTime() - 15 * 86400000)), end: isoDate(new Date(DEMO_TODAY.getTime() - 9 * 86400000)) }

function event(currentCounts: number[], prevCounts: number[]): EventData {
  const current = toDayCounts(CURRENT_DATES, currentCounts)
  const prev = toDayCounts(PREV_DATES, prevCounts)
  return { current, prev, totalCurrent: sum(currentCounts), totalPrev: sum(prevCounts) }
}

function param(eventName: string, parameterName: string, ga4Dimension: string, currentPct: number, prevPct: number, totalEvents: number, topValues: { value: string; count: number }[] = []): ParameterData {
  const current = { total_events: totalEvents, events_with_value: Math.round(totalEvents * currentPct), coverage: currentPct, top_values: topValues }
  const prevTotal = Math.round(totalEvents * 0.94)
  const prev = { total_events: prevTotal, events_with_value: Math.round(prevTotal * prevPct), coverage: prevPct, top_values: [] }
  return {
    event_name: eventName, parameter_name: parameterName, ga4_dimension: ga4Dimension,
    current, prev,
    delta_relative: prevPct > 0 ? ((currentPct - prevPct) / prevPct) * 100 : null,
    delta_absolute: (currentPct - prevPct) * 100,
    ranges: { current: CURRENT_RANGE, prev: PREV_RANGE },
  }
}

// Generates a plausible score run history: `days` entries, newest first,
// oscillating around `base` and ending exactly on `latest`.
function scoreRuns(projectId: string, days: number, base: number, wobble: number, latest: number): { id: string; run_date: string; score_total: number; status: 'completed'; sampled: boolean; sampling_ratio: number | null }[] {
  const out: { id: string; run_date: string; score_total: number; status: 'completed'; sampled: boolean; sampling_ratio: number | null }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(DEMO_TODAY); d.setUTCDate(d.getUTCDate() - 2 - i)
    // Deterministic pseudo-noise (no Math.random — the page must render
    // identically on every request/build).
    const wave = Math.sin(i * 0.9) * wobble + Math.cos(i * 0.37) * (wobble * 0.4)
    const score = i === 0 ? latest : Math.max(0, Math.min(100, Math.round(base + wave)))
    out.push({ id: `${projectId}-run-${i}`, run_date: isoDate(d), score_total: score, status: 'completed', sampled: false, sampling_ratio: null })
  }
  return out
}

export interface DemoProjectSummary {
  id: string
  name: string
  ga4_property_id: string
  status: 'active' | 'paused'
  alert_threshold: number
  alert_email: string | null
  auto_run: boolean
  last_score: number
  prev_week_score: number
  ecommerce_events_count: number
  custom_events_count: number
  parameter_checks_count: number
}

export interface DemoHistoryEntry {
  date: string
  label: string
  kind: 'warn' | 'fail'
  detail: string
  category: 'traffic' | 'engagement' | 'users' | 'ecommerce' | 'custom_events' | 'parameters'
}

export interface DemoProjectDetail {
  summary: DemoProjectSummary
  runs: { id: string; run_date: string; score_total: number; status: 'completed'; sampled: boolean; sampling_ratio: number | null }[]
  checks: CheckResult[]
  ecommerce: { name: string; data: EventData }[]
  customEvents: { name: string; data: EventData }[]
  parameters: ParameterData[]
  history: DemoHistoryEntry[]
}

// ============================================================
// Project 1 — ecommerce store, mostly healthy
// ============================================================

const SHOP_ID = 'sklep-rowerowy'

// All 20 live checks the real app computes (app/api/ga4/checks/route.ts) —
// same ids/labels/descriptions/thresholds, just fed fixed numbers instead
// of a GA4 report, so the demo shows the full breadth of what gets
// monitored, not a curated subset.
const shopChecks: CheckResult[] = [
  // Traffic Source (9)
  { id: 'self_referral', section: 'traffic', label: 'Self-referral', description: 'Share of sessions where your own domain shows up as the referrer — a sign of broken cross-domain or UTM tracking.', status: 'pass', valueLabel: '0.00%', prevLabel: '0.00%', deltaLabel: 'All clear' },
  { id: 'total_sessions', section: 'traffic', label: 'Sessions', description: 'Total sessions vs prev 7d — a large drop can signal broken tracking or real traffic loss; a large spike may indicate bot traffic.', status: 'pass', valueLabel: '14,820', prevLabel: '14,100', deltaLabel: '+5.1%' },
  { id: 'not_set_share', section: 'traffic', label: '(not set) share', description: 'Sessions where source or medium is (not set) — indicates missing UTM parameters or broken tracking.', status: 'pass', valueLabel: '0.8%', prevLabel: '1.0%', deltaLabel: '−0.2pp' },
  { id: 'direct_none_share', section: 'traffic', label: 'Direct/None share', description: 'Change in (direct)/(none) traffic share vs prev 7d — spikes often signal missing UTMs, email/app dark traffic, or HTTPS stripping.', status: 'pass', valueLabel: '17.9%', prevLabel: '17.2%', deltaLabel: '+0.7pp' },
  { id: 'organic_search_share', section: 'traffic', label: 'Organic Search share', description: 'Change in Organic Search (medium=organic) traffic share vs prev 7d — drops may indicate a Google penalty or indexing issues.', status: 'pass', valueLabel: '38.2%', prevLabel: '37.5%', deltaLabel: '+0.7pp' },
  { id: 'google_ads_share', section: 'traffic', label: 'Google Ads share', description: 'Change in Google Ads (google/cpc) traffic share vs prev 7d.', status: 'pass', valueLabel: '12.1%', prevLabel: '11.8%', deltaLabel: '+0.3pp' },
  { id: 'direct_traffic_spike', section: 'traffic', label: 'Direct traffic spike', description: 'Change in Direct (medium=none) traffic share vs prev 7d — spikes often signal missing UTM parameters or dark traffic.', status: 'pass', valueLabel: '18.2%', prevLabel: '17.5%', deltaLabel: '+4.0%' },
  { id: 'all_channels_shift', section: 'traffic', label: 'Channel distribution shift', description: 'Largest single-channel share change vs prev 7d — flags unusual shifts in the attribution mix.', status: 'pass', valueLabel: '3.2pp max', prevLabel: '', deltaLabel: 'Organic Search: +3.2pp', detail: 'Largest: Organic Search' },
  { id: 'new_hostname', section: 'traffic', label: 'New hostname', description: 'Flags any hostname with 100+ sessions vs prev 7d that wasn’t seen in the previous period — a sign of a hijacked/cloned tag, a staging/dev domain going live, or a broken cross-domain setup.', status: 'pass', valueLabel: 'None', prevLabel: '', deltaLabel: 'All clear' },
  // Engagement (6)
  { id: 'bounce_rate', section: 'engagement', label: 'Bounce rate shift', description: 'Change in bounce rate vs prev 7d — a spike may indicate a broken page or misconfigured engagement events.', status: 'pass', valueLabel: '31.2%', prevLabel: '33.0%', deltaLabel: '−5.5%' },
  { id: 'engagement_rate', section: 'engagement', label: 'Engagement rate', description: 'Share of sessions lasting 10+ seconds or triggering a conversion — below 20% suggests bot traffic or broken tracking. Note: above 75% can be artificially inflated — check your Engagement Rate / engaged-session settings in GA4.', status: 'pass', valueLabel: '78.4%', prevLabel: '76.0%', deltaLabel: '+2.4pp' },
  { id: 'pages_per_session', section: 'engagement', label: 'Pages / session shift', description: 'Change in pages per session vs prev 7d — a drop may indicate broken navigation or redirect loops.', status: 'pass', valueLabel: '3.85', prevLabel: '3.70', deltaLabel: '+4.1%' },
  { id: 'session_duration', section: 'engagement', label: 'Session duration shift', description: 'Change in average session duration vs prev 7d — drops can indicate bot traffic or UX degradation.', status: 'pass', valueLabel: '142s', prevLabel: '135s', deltaLabel: '+5.2%' },
  { id: 'conversion_rate', section: 'engagement', label: 'Conversion rate', description: 'Change in session conversion rate vs prev 7d.', status: 'warn', valueLabel: '1.80%', prevLabel: '2.60%', deltaLabel: '−30.8%' },
  { id: 'page_title_null', section: 'engagement', label: 'Page title coverage', description: 'Share of sessions with a missing or blank page title.', status: 'pass', valueLabel: '0.30%', prevLabel: '0.50%', deltaLabel: '−40.0%' },
  // Users (5)
  { id: 'geo_anomaly', section: 'users', label: 'Geographic anomaly', description: 'New countries pulling more than 3% of total sessions vs prev 7d.', status: 'pass', valueLabel: 'No change', prevLabel: '', deltaLabel: 'All clear' },
  { id: 'unknown_country', section: 'users', label: 'Unknown country share', description: 'Sessions without an assigned country — elevated values may indicate VPN traffic or bot activity.', status: 'pass', valueLabel: '0.8%', prevLabel: '1.1%', deltaLabel: '−0.3pp' },
  { id: 'geo_spike', section: 'users', label: 'Geographic spike', description: 'Flags any country whose session share jumped 15+ pp vs the previous period — a strong bot signal.', status: 'pass', valueLabel: '4.1pp max', prevLabel: '', deltaLabel: 'Germany: +4.1pp', detail: 'Largest: Germany' },
  { id: 'bot_suspicion', section: 'users', label: 'Bot Suspicion Index', description: 'Combines 4 signals (new-user ratio, engagement rate, session length, direct share) into a risk score.', status: 'pass', valueLabel: '0/4 signals', prevLabel: '', deltaLabel: 'All clear', detail: 'No signals triggered' },
  { id: 'bot_traffic_night', section: 'users', label: 'Night traffic spike', description: 'Change in night-time (0–5h) traffic share vs prev 7d — a common bot signal.', status: 'pass', valueLabel: '2.1%', prevLabel: '2.4%', deltaLabel: '−12.5%' },
]

const shopEcommerce: { name: string; data: EventData }[] = [
  { name: 'view_item',      data: event([1120, 1180, 1240, 1160, 1210, 1190, 1100], [1080, 1140, 1190, 1120, 1160, 1150, 1060]) },
  { name: 'add_to_cart',    data: event([215, 208, 226, 198, 210, 201, 12], [212, 214, 221, 205, 219, 208, 213]) },
  { name: 'begin_checkout', data: event([92, 88, 95, 84, 90, 87, 76], [86, 90, 88, 82, 91, 84, 79]) },
  { name: 'purchase',       data: event([32, 29, 34, 28, 31, 30, 30], [28, 27, 31, 26, 29, 29, 28]) },
]

const shopCustomEvents: { name: string; data: EventData }[] = [
  { name: 'newsletter_signup', data: event([18, 22, 19, 24, 21, 17, 20], [15, 19, 17, 20, 18, 16, 17]) },
  { name: 'account_created',   data: event([24, 19, 27, 21, 25, 20, 23], [21, 18, 24, 20, 22, 19, 21]) },
  { name: 'wishlist_add',      data: event([56, 61, 58, 64, 59, 52, 60], [50, 54, 52, 57, 53, 47, 55]) },
  { name: 'review_submitted',  data: event([9, 7, 11, 8, 10, 6, 9], [8, 7, 9, 7, 8, 6, 8]) },
]

const shopParameters: ParameterData[] = [
  param('purchase', 'transaction_id', 'transactionId', 1.0, 1.0, 214),
  param('purchase', 'currency', 'currencyCode', 1.0, 1.0, 214),
  param('purchase', 'coupon', 'orderCoupon', 0.042, 0.038, 214),
  param('add_to_cart', 'item_id', 'itemId', 0.99, 0.99, 1402),
  param('add_to_cart', 'item_category2', 'itemCategory2', 0.68, 0.71, 1402, [{ value: 'road-bikes', count: 520 }, { value: 'mtb', count: 410 }, { value: 'accessories', count: 283 }]),
  param('view_item', 'item_name', 'itemName', 1.0, 1.0, 8200),
  param('view_item', 'item_category', 'itemCategory', 0.98, 0.97, 8200),
  param('begin_checkout', 'currency', 'currencyCode', 1.0, 1.0, 612),
]

const shopHistory: DemoHistoryEntry[] = [
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 2 * 86400000)), label: 'Conversion rate', kind: 'warn', detail: 'Session conversion rate: 1.8% (prev: 2.6%, WoW: -30.8%)', category: 'engagement' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 6 * 86400000)), label: 'Parameter: add_to_cart.item_category2', kind: 'warn', detail: 'Coverage dropped to 68% (prev: 82%) — check the product feed for missing subcategories.', category: 'parameters' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 9 * 86400000)), label: 'Custom event: newsletter_signup', kind: 'warn', detail: 'Volume dropped to 9 (prev: 21, WoW: -57.1%)', category: 'custom_events' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 15 * 86400000)), label: 'Bounce rate shift', kind: 'warn', detail: 'Bounce rate: 44.1% (prev: 33.5%, WoW: +31.6%)', category: 'engagement' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 21 * 86400000)), label: 'Ecommerce events', kind: 'fail', detail: 'add_to_cart volume collapsed to 4 (prev: 1,402) — tag likely broken after a site release.', category: 'ecommerce' },
]

// ============================================================
// Project 2 — content site, no ecommerce, needs attention
// ============================================================

const BLOG_ID = 'blog-techniczny'

const blogChecks: CheckResult[] = [
  // Traffic Source (9)
  { id: 'self_referral', section: 'traffic', label: 'Self-referral', description: 'Share of sessions where your own domain shows up as the referrer — a sign of broken cross-domain or UTM tracking.', status: 'warn', valueLabel: '0.30%', prevLabel: '0.20%', deltaLabel: '+50.0%' },
  { id: 'total_sessions', section: 'traffic', label: 'Sessions', description: 'Total sessions vs prev 7d — a large drop can signal broken tracking or real traffic loss; a large spike may indicate bot traffic.', status: 'warn', valueLabel: '8,500', prevLabel: '11,200', deltaLabel: '−24.1%' },
  { id: 'not_set_share', section: 'traffic', label: '(not set) share', description: 'Sessions where source or medium is (not set) — indicates missing UTM parameters or broken tracking.', status: 'warn', valueLabel: '3.2%', prevLabel: '2.1%', deltaLabel: '+1.1pp' },
  { id: 'direct_none_share', section: 'traffic', label: 'Direct/None share', description: 'Change in (direct)/(none) traffic share vs prev 7d — spikes often signal missing UTMs, email/app dark traffic, or HTTPS stripping.', status: 'warn', valueLabel: '40.0%', prevLabel: '24.1%', deltaLabel: '+15.9pp' },
  { id: 'organic_search_share', section: 'traffic', label: 'Organic Search share', description: 'Change in Organic Search (medium=organic) traffic share vs prev 7d — drops may indicate a Google penalty or indexing issues.', status: 'pass', valueLabel: '22.0%', prevLabel: '29.5%', deltaLabel: '−7.5pp' },
  { id: 'google_ads_share', section: 'traffic', label: 'Google Ads share', description: 'Change in Google Ads (google/cpc) traffic share vs prev 7d.', status: 'pass', valueLabel: '9.0%', prevLabel: '9.4%', deltaLabel: '−0.4pp' },
  { id: 'direct_traffic_spike', section: 'traffic', label: 'Direct traffic spike', description: 'Change in Direct (medium=none) traffic share vs prev 7d — spikes often signal missing UTM parameters or dark traffic.', status: 'warn', valueLabel: '29.1%', prevLabel: '23.8%', deltaLabel: '+22.3%' },
  { id: 'all_channels_shift', section: 'traffic', label: 'Channel distribution shift', description: 'Largest single-channel share change vs prev 7d — flags unusual shifts in the attribution mix.', status: 'warn', valueLabel: '22.0pp max', prevLabel: '', deltaLabel: 'Direct/None: +22.0pp', detail: 'Largest: Direct/None' },
  { id: 'new_hostname', section: 'traffic', label: 'New hostname', description: 'Flags any hostname with 100+ sessions vs prev 7d that wasn’t seen in the previous period — a sign of a hijacked/cloned tag, a staging/dev domain going live, or a broken cross-domain setup.', status: 'check', valueLabel: '1 new', prevLabel: '', deltaLabel: 'stats-preview.blogtechniczny.pl', detail: 'stats-preview.blogtechniczny.pl: 142 sessions' },
  // Engagement (6)
  { id: 'bounce_rate', section: 'engagement', label: 'Bounce rate shift', description: 'Change in bounce rate vs prev 7d — a spike may indicate a broken page or misconfigured engagement events.', status: 'warn', valueLabel: '52.6%', prevLabel: '41.0%', deltaLabel: '+28.3%' },
  { id: 'engagement_rate', section: 'engagement', label: 'Engagement rate', description: 'Share of sessions lasting 10+ seconds or triggering a conversion — below 20% suggests bot traffic or broken tracking.', status: 'warn', valueLabel: '38.4%', prevLabel: '44.0%', deltaLabel: '−5.6pp' },
  { id: 'pages_per_session', section: 'engagement', label: 'Pages / session shift', description: 'Change in pages per session vs prev 7d — a drop may indicate broken navigation or redirect loops.', status: 'pass', valueLabel: '2.30', prevLabel: '2.60', deltaLabel: '−11.5%' },
  { id: 'session_duration', section: 'engagement', label: 'Session duration shift', description: 'Change in average session duration vs prev 7d — drops can indicate bot traffic or UX degradation.', status: 'warn', valueLabel: '58s', prevLabel: '95s', deltaLabel: '−38.9%' },
  { id: 'conversion_rate', section: 'engagement', label: 'Conversion rate', description: 'Change in session conversion rate vs prev 7d.', status: 'pass', valueLabel: '3.10%', prevLabel: '2.90%', deltaLabel: '+6.9%' },
  { id: 'page_title_null', section: 'engagement', label: 'Page title coverage', description: 'Share of sessions with a missing or blank page title.', status: 'warn', valueLabel: '6.20%', prevLabel: '1.80%', deltaLabel: '+244.4%' },
  // Users (5)
  { id: 'geo_anomaly', section: 'users', label: 'Geographic anomaly', description: 'New countries pulling more than 3% of total sessions vs prev 7d.', status: 'warn', valueLabel: '1 new', prevLabel: '', deltaLabel: 'Vietnam', detail: 'New: Vietnam' },
  { id: 'unknown_country', section: 'users', label: 'Unknown country share', description: 'Sessions without an assigned country — elevated values may indicate VPN traffic or bot activity.', status: 'pass', valueLabel: '1.6%', prevLabel: '1.4%', deltaLabel: '+0.2pp' },
  { id: 'geo_spike', section: 'users', label: 'Geographic spike', description: 'Flags any country whose session share jumped 15+ pp vs the previous period — a strong bot signal.', status: 'warn', valueLabel: '9.5pp max', prevLabel: '', deltaLabel: 'Vietnam: +9.5pp', detail: 'Largest: Vietnam' },
  { id: 'bot_suspicion', section: 'users', label: 'Bot Suspicion Index', description: 'Combines 4 signals (new-user ratio, engagement rate, session length, direct share) into a risk score.', status: 'warn', valueLabel: '2/4 signals', prevLabel: '', deltaLabel: 'New users > 97%', detail: 'New users > 97% · Direct + (not set) > 78%' },
  { id: 'bot_traffic_night', section: 'users', label: 'Night traffic spike', description: 'Change in night-time (0–5h) traffic share vs prev 7d — a common bot signal.', status: 'pass', valueLabel: '1.5%', prevLabel: '1.6%', deltaLabel: '−6.3%' },
]

const blogCustomEvents: { name: string; data: EventData }[] = [
  { name: 'article_read',      data: event([1520, 1610, 1580, 1690, 1640, 1490, 1550], [1420, 1490, 1470, 1560, 1510, 1400, 1440]) },
  { name: 'form_send',         data: event([34, 29, 38, 31, 36, 28, 33], [30, 27, 32, 29, 31, 26, 30]) },
  { name: 'newsletter_signup', data: event([26, 24, 22, 3, 1, 2, 2], [25, 28, 24, 27, 26, 23, 25]) },
  { name: 'comment_posted',    data: event([41, 38, 45, 36, 42, 33, 39], [37, 35, 40, 33, 38, 30, 36]) },
  { name: 'search',            data: event([210, 198, 225, 190, 205, 180, 200], [195, 188, 208, 180, 197, 170, 190]) },
  { name: 'share_click',       data: event([63, 58, 67, 55, 61, 50, 59], [59, 55, 63, 52, 58, 48, 56]) },
]

const blogParameters: ParameterData[] = [
  param('article_read', 'article_category', 'articleCategory', 0.94, 0.96, 11080),
  param('article_read', 'author', 'author', 0.61, 0.88, 11080),
  param('newsletter_signup', 'source', 'source', 0.72, 0.9, 60),
  param('form_send', 'form_name', 'formName', 0.97, 0.98, 229),
  param('search', 'search_term', 'searchTerm', 0.89, 0.9, 1408),
  param('comment_posted', 'article_id', 'articleId', 0.95, 0.96, 274),
]

const blogHistory: DemoHistoryEntry[] = [
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 2 * 86400000)), label: 'Custom event: newsletter_signup', kind: 'fail', detail: 'Volume collapsed to 3 (prev: 26, WoW: -88.5%) — the signup form likely broke after the last deploy.', category: 'custom_events' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 2 * 86400000)), label: 'Geographic anomaly', kind: 'warn', detail: 'New country pulling >3% of sessions: Vietnam.', category: 'users' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 3 * 86400000)), label: 'Bounce rate shift', kind: 'warn', detail: 'Bounce rate: 52.6% (prev: 41.0%, WoW: +28.3%)', category: 'engagement' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 5 * 86400000)), label: 'New hostname', kind: 'warn', detail: 'New: stats-preview.blogtechniczny.pl (142 sessions)', category: 'traffic' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 8 * 86400000)), label: 'Parameter: article_read.author', kind: 'warn', detail: 'Coverage dropped to 61% (prev: 88%) — several new articles are missing the author tag.', category: 'parameters' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 12 * 86400000)), label: 'Engagement Rate', kind: 'warn', detail: 'Engagement rate: 38.4% (prev: 44.0%, WoW: -12.7%)', category: 'engagement' },
  { date: isoDate(new Date(DEMO_TODAY.getTime() - 18 * 86400000)), label: 'Direct traffic spike', kind: 'warn', detail: 'Direct share: 33.6% (prev: 24.1%, WoW: +39.4%)', category: 'traffic' },
]

// ============================================================
// Exports
// ============================================================

export const DEMO_PROJECTS: DemoProjectSummary[] = [
  {
    id: SHOP_ID, name: 'Sklep Rowerowy (Demo)', ga4_property_id: 'properties/348219004',
    status: 'active', alert_threshold: 70, alert_email: 'demo@example.com', auto_run: true,
    last_score: 91, prev_week_score: 88,
    ecommerce_events_count: 4, custom_events_count: 4, parameter_checks_count: 8,
  },
  {
    id: BLOG_ID, name: 'Blog Techniczny (Demo)', ga4_property_id: 'properties/219873305',
    status: 'active', alert_threshold: 70, alert_email: 'demo@example.com', auto_run: true,
    last_score: 58, prev_week_score: 71,
    ecommerce_events_count: 0, custom_events_count: 6, parameter_checks_count: 6,
  },
]

export const DEMO_PROJECT_DETAIL: Record<string, DemoProjectDetail> = {
  [SHOP_ID]: {
    summary: DEMO_PROJECTS[0],
    runs: scoreRuns(SHOP_ID, 30, 89, 4, 91),
    checks: shopChecks,
    ecommerce: shopEcommerce,
    customEvents: shopCustomEvents,
    parameters: shopParameters,
    history: shopHistory,
  },
  [BLOG_ID]: {
    summary: DEMO_PROJECTS[1],
    runs: scoreRuns(BLOG_ID, 30, 68, 6, 58),
    checks: blogChecks,
    ecommerce: [],
    customEvents: blogCustomEvents,
    parameters: blogParameters,
    history: blogHistory,
  },
}

export const DEMO_LATEST_RUN_DATE = isoDate(new Date(DEMO_TODAY.getTime() - 2 * 86400000))
