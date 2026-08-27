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
  // 'items' (the array parameter) isn't suggested — it's a compound/array
  // value, not a single Data API dimension, so there's no coverage check
  // that can query it directly. The individual fields it carries per line
  // item (item_id, item_name, ...) are covered on add_to_cart/view_item.
  { event_name: 'purchase', parameter_name: 'transaction_id', label: 'Transaction ID', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'value', label: 'Value (revenue)', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'currency', label: 'Currency', is_required_default: true },
  { event_name: 'purchase', parameter_name: 'coupon', label: 'Coupon code', is_required_default: false },
  // Item-level fields, not 'value'/'currency' (event-scoped, not per-item —
  // add_to_cart is about the product being added, not a cart-wide total).
  { event_name: 'add_to_cart', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'price', label: 'Item price', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'quantity', label: 'Item quantity', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'item_category', label: 'Item category', is_required_default: true },
  { event_name: 'add_to_cart', parameter_name: 'item_category2', label: 'Item category 2', is_required_default: false },
  { event_name: 'add_to_cart', parameter_name: 'item_category3', label: 'Item category 3', is_required_default: false },
  { event_name: 'view_item', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'view_item', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'begin_checkout', parameter_name: 'value', label: 'Cart value', is_required_default: false },
  { event_name: 'begin_checkout', parameter_name: 'currency', label: 'Currency', is_required_default: false },
]
