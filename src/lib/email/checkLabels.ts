// Friendly English labels for the worker's internal check_key identifiers.
// The dashboard doesn't currently render these particular checks (core
// checks are scored but not shown as cards), so this mapping exists only
// for the emails — keep it in sync if that ever changes.
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
