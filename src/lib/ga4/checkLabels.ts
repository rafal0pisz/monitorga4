// Friendly English labels for the worker's internal check_key identifiers.
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
  country_share: 'Country share',
  custom_events_check: 'Custom events',
  ecommerce_events: 'Ecommerce events',
}

export function checkLabel(checkKey: string): string {
  if (LABELS[checkKey]) return LABELS[checkKey]
  if (checkKey.startsWith('custom_event_')) return `Custom event: ${checkKey.slice('custom_event_'.length)}`
  if (checkKey.startsWith('param_')) return 'Parameter coverage'
  return checkKey
}

// Shared by the history page and the client alert email so the grouping
// can't drift between the two.
export type Category = 'traffic' | 'engagement' | 'users' | 'ecommerce' | 'custom_events' | 'parameters'

export const CATEGORY_LABEL: Record<Category, string> = {
  traffic: 'Traffic',
  engagement: 'Engagement',
  users: 'Users',
  ecommerce: 'Ecommerce',
  custom_events: 'Custom Events',
  parameters: 'Parameters',
}

export const CATEGORY_ORDER: Category[] = ['traffic', 'engagement', 'users', 'ecommerce', 'custom_events', 'parameters']

export function checkCategory(checkKey: string): Category {
  if (checkKey.startsWith('custom_event_')) return 'custom_events'
  if (checkKey.startsWith('param_')) return 'parameters'
  if (checkKey === 'ecommerce_events' || checkKey === 'purchase_duplicates') return 'ecommerce'
  if (checkKey === 'self_referral' || checkKey === 'direct_traffic_spike') return 'traffic'
  if (checkKey === 'geo_anomaly' || checkKey === 'bot_traffic_night' || checkKey === 'country_share') return 'users'
  return 'engagement' // expected_events, bounce_rate_anomaly, conversion_rate, page_title_null
}
