// Standard GA4 ecommerce events — mirrors the `ecommerce_events_catalog`
// table seed (supabase/migrations/005_sections.sql) so the wizard and the
// project settings form share one list instead of drifting separately.
export interface EcommerceCatalogEvent {
  event_name: string
  label: string
}

export const ECOMMERCE_CATALOG: EcommerceCatalogEvent[] = [
  { event_name: 'purchase', label: 'Purchase' },
  { event_name: 'begin_checkout', label: 'Begin checkout' },
  { event_name: 'add_to_cart', label: 'Add to cart' },
  { event_name: 'remove_from_cart', label: 'Remove from cart' },
  { event_name: 'view_cart', label: 'View cart' },
  { event_name: 'view_item', label: 'View item' },
  { event_name: 'view_item_list', label: 'View item list' },
  { event_name: 'select_item', label: 'Select item' },
  { event_name: 'add_to_wishlist', label: 'Add to wishlist' },
  { event_name: 'add_payment_info', label: 'Add payment info' },
  { event_name: 'add_shipping_info', label: 'Add shipping info' },
  { event_name: 'select_promotion', label: 'Select promotion' },
  { event_name: 'view_promotion', label: 'View promotion' },
  { event_name: 'refund', label: 'Refund' },
]
