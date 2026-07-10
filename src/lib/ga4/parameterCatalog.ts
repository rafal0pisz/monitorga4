// Predefined per-event parameter suggestions — mirrors the `parameter_catalog`
// table seed (supabase/migrations/005_sections.sql), used to pre-populate
// parameter checks for events selected in the project creation wizard.
export interface ParameterCatalogEntry {
  event_name: string
  parameter_name: string
  label: string
  is_required_default: boolean
}

export const PARAMETER_CATALOG: ParameterCatalogEntry[] = [
  { event_name: 'purchase', parameter_name: 'transaction_id', label: 'Transaction ID', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'value', label: 'Value (revenue)', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'currency', label: 'Currency', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'items', label: 'Items array', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'coupon', label: 'Coupon code', is_required_default: false },
  { event_name: 'add_to_cart', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'currency', label: 'Currency', is_required_default: false },
  { event_name: 'add_to_cart', parameter_name: 'value', label: 'Value', is_required_default: false },
  { event_name: 'view_item', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'view_item', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'begin_checkout', parameter_name: 'value', label: 'Cart value', is_required_default: false },
  { event_name: 'begin_checkout', parameter_name: 'currency', label: 'Currency', is_required_default: false },
]
