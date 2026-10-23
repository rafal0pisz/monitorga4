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

  // Below: the remaining standard GA4 ecommerce events. Every entry here is
  // deliberately limited to parameter names the coverage-check mechanism
  // (app/api/worker/run/route.ts's processParam) can actually resolve
  // correctly without a custom dimension being registered:
  //   - a GA4_STANDARD_PARAMS/_METRICS entry (auto-collected, works for any
  //     event via its own eventName filter), or
  //   - an item-scoped field (item_id/item_name/...) ONLY for an event that
  //     already has an entry in ITEM_METRIC_BY_EVENT (standardParams.ts) —
  //     without one, that same code path throws "Coverage check not
  //     supported for item-scoped parameter" outright.
  // Fields Google documents as "recommended" for some of these events
  // (promotion_id, promotion_name, creative_name/slot, payment_type,
  // shipping_tier) are NOT auto-collected GA4 dimensions — suggesting them
  // here would silently resolve to `customEvent:<name>` and read as ~0%
  // coverage for any account that hasn't separately registered that exact
  // custom dimension, which is a worse default than not suggesting it.
  { event_name: 'view_item_list', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'view_item_list', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'select_item', parameter_name: 'item_id', label: 'Item ID', is_required_default: true },
  { event_name: 'select_item', parameter_name: 'item_name', label: 'Item name', is_required_default: true },
  { event_name: 'view_promotion', parameter_name: 'item_id', label: 'Item ID', is_required_default: false },
  { event_name: 'view_promotion', parameter_name: 'item_name', label: 'Item name', is_required_default: false },
  { event_name: 'select_promotion', parameter_name: 'item_id', label: 'Item ID', is_required_default: false },
  { event_name: 'select_promotion', parameter_name: 'item_name', label: 'Item name', is_required_default: false },
  { event_name: 'view_cart', parameter_name: 'value', label: 'Cart value', is_required_default: false },
  { event_name: 'view_cart', parameter_name: 'currency', label: 'Currency', is_required_default: false },
  { event_name: 'add_to_wishlist', parameter_name: 'value', label: 'Value', is_required_default: false },
  { event_name: 'add_to_wishlist', parameter_name: 'currency', label: 'Currency', is_required_default: false },
  { event_name: 'add_shipping_info', parameter_name: 'value', label: 'Cart value', is_required_default: false },
  { event_name: 'add_shipping_info', parameter_name: 'currency', label: 'Currency', is_required_default: false },
  { event_name: 'add_payment_info', parameter_name: 'value', label: 'Cart value', is_required_default: false },
  { event_name: 'add_payment_info', parameter_name: 'currency', label: 'Currency', is_required_default: false },
  { event_name: 'refund', parameter_name: 'transaction_id', label: 'Transaction ID', is_required_default: true },
  { event_name: 'refund', parameter_name: 'value', label: 'Value (refund amount)', is_required_default: true },
  { event_name: 'refund', parameter_name: 'currency', label: 'Currency', is_required_default: false },

  // remove_from_cart deliberately has NO entries: it has no item-metric
  // mapping in ITEM_METRIC_BY_EVENT (no documented GA4 Data API metric for
  // "items removed from cart" to check item-scoped fields against), and
  // none of its other fields are auto-collected standard dimensions either
  // — there's currently no parameter for this event the coverage check can
  // validate without a false "0% covered" reading.
]
