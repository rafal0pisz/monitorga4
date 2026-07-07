// Friendly English labels for the worker's internal check_key identifiers,
// and which "Core Checks" section each belongs to on the project page.
// Shared between the dashboard UI and the email templates so naming can't
// drift between the two.
const LABELS: Record<string, string> = {
  expected_events: 'Expected events',
  self_referral: 'Self-referral',
  direct_traffic_spike: 'Direct traffic spike',
  bounce_rate_anomaly: 'Bounce rate anomaly',
  conversion_rate: 'Conversion rate',
  page_title_null: 'Page title coverage',
  bot_traffic_night: 'Night traffic spike',
  purchase_duplicates: 'Purchase/session ratio',
  geo_anomaly: 'Geographic anomaly',
  session_no_events: 'Sessions without engagement',
  custom_events_check: 'Custom events',
  ecommerce_events: 'Ecommerce events',
}

export function checkLabel(checkKey: string): string {
  if (LABELS[checkKey]) return LABELS[checkKey]
  if (checkKey.startsWith('custom_event_')) return `Custom event: ${checkKey.slice('custom_event_'.length)}`
  if (checkKey.startsWith('param_')) return 'Parameter coverage'
  return checkKey
}

// The 9 "core" checks that always run but aren't ecommerce/custom
// events/parameters — grouped the same way as the live Traffic/Engagement/
// Users panel, so the two feel like one taxonomy instead of two.
export type CoreSection = 'traffic' | 'engagement' | 'users'

export const CORE_CHECK_SECTION: Record<string, CoreSection> = {
  self_referral: 'traffic',
  direct_traffic_spike: 'traffic',
  expected_events: 'engagement',
  bounce_rate_anomaly: 'engagement',
  conversion_rate: 'engagement',
  page_title_null: 'engagement',
  session_no_events: 'engagement',
  geo_anomaly: 'users',
  bot_traffic_night: 'users',
}
