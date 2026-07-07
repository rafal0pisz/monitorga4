import { checkLabel, CORE_CHECK_SECTION, type CoreSection } from './checkLabels'

// Formats a stored core-check dqs_results row into the same shape
// LiveChecksPanel's cards expect, so the daily-run results can be merged
// into the same Traffic Source / Engagement / Users sections as the live
// on-demand checks instead of living in a separate, duplicate-looking block.

const DESCRIPTIONS: Record<string, string> = {
  expected_events: 'Configured events expected to appear at least once in the last 30 days.',
  self_referral: 'Share of sessions where your own domain shows up as the referrer — a sign of broken cross-domain or UTM tracking.',
  direct_traffic_spike: 'Change in Direct traffic share week-over-week — spikes often signal missing UTM parameters or dark traffic.',
  bounce_rate_anomaly: 'Change in bounce rate week-over-week.',
  conversion_rate: 'Change in conversion rate week-over-week.',
  page_title_null: 'Share of sessions with a missing or blank page title.',
  session_no_events: 'Estimated sessions with no engagement — a proxy for missing event tracking.',
  geo_anomaly: 'New countries entering the Top 5 by sessions, week-over-week.',
  bot_traffic_night: 'Change in night-time (0–5h) traffic share, week-over-week — a common bot signal.',
}

export interface PanelCheck {
  id: string
  section: CoreSection
  label: string
  description: string
  status: 'pass' | 'warn' | 'check'
  valueLabel: string
  prevLabel: string
  deltaLabel: string
  detail?: string
}

function pct(n: unknown): string {
  return typeof n === 'number' ? `${n}%` : '—'
}

function signed(n: unknown): string {
  if (typeof n !== 'number') return ''
  return `${n >= 0 ? '+' : ''}${n}%`
}

export function formatCoreCheckForPanel(row: { check_key: string; status: string; value: any; message: string }): PanelCheck | null {
  const section = CORE_CHECK_SECTION[row.check_key]
  if (!section) return null

  const status: PanelCheck['status'] = row.status === 'fail' ? 'check' : (row.status as 'pass' | 'warn')
  const v = row.value ?? {}
  const base = {
    id: row.check_key,
    section,
    label: checkLabel(row.check_key),
    description: DESCRIPTIONS[row.check_key] ?? row.message,
    status,
  }

  switch (row.check_key) {
    case 'expected_events':
      return { ...base, valueLabel: !v.missing || v.missing.length === 0 ? 'All present' : `${v.missing.length} missing`, prevLabel: '', deltaLabel: '' }
    case 'self_referral':
      return { ...base, valueLabel: pct(v.ratio), prevLabel: '', deltaLabel: '' }
    case 'direct_traffic_spike':
      return { ...base, valueLabel: pct(v.direct_ratio_current), prevLabel: pct(v.direct_ratio_prev), deltaLabel: signed(v.delta) }
    case 'bounce_rate_anomaly':
      return { ...base, valueLabel: pct(v.current), prevLabel: pct(v.prev), deltaLabel: signed(v.delta) }
    case 'conversion_rate':
      return { ...base, valueLabel: pct(v.cr_current), prevLabel: pct(v.cr_prev), deltaLabel: signed(v.delta) }
    case 'page_title_null':
      return { ...base, valueLabel: pct(v.null_rate), prevLabel: '', deltaLabel: '' }
    case 'session_no_events':
      return { ...base, valueLabel: pct(v.ratio), prevLabel: '', deltaLabel: '' }
    case 'geo_anomaly':
      return { ...base, valueLabel: !v.new_countries || v.new_countries.length === 0 ? 'No change' : `${v.new_countries.length} new`, prevLabel: '', deltaLabel: '', detail: v.new_countries?.join(', ') }
    case 'bot_traffic_night':
      return { ...base, valueLabel: pct(v.night_ratio_current), prevLabel: pct(v.night_ratio_prev), deltaLabel: signed(v.delta) }
    default:
      return { ...base, valueLabel: row.message, prevLabel: '', deltaLabel: '' }
  }
}
