// Standard GA4 parameter → Data API dimension name mapping.
// These are auto-collected by GA4 and don't need custom dimension
// registration — shared between the worker (scoring) and the project
// settings form (validating parameter names before they're saved).
export const GA4_STANDARD_PARAMS: Record<string, string> = {
  transaction_id: 'transactionId',
  currency:       'currencyCode',
  item_id:        'itemId',
  item_name:      'itemName',
  item_brand:     'itemBrand',
  item_category:  'itemCategory',
  item_category2: 'itemCategory2',
  item_category3: 'itemCategory3',
  item_category4: 'itemCategory4',
  item_category5: 'itemCategory5',
  item_variant:   'itemVariant',
  affiliation:    'orderCoupon',
  coupon:         'orderCoupon',
}

// Standard GA4 metrics (not dimensions)
export const GA4_STANDARD_METRICS: Record<string, string> = {
  value:    'purchaseRevenue',
  price:    'itemRevenue',
  quantity: 'itemsAddedToCart',
  shipping: 'shippingAmount',
  tax:      'taxAmount',
}

// Item-scoped dimensions (product-level ecommerce fields) can't be combined
// with an event-scoped metric like `eventCount` — GA4 Data API rejects it
// ("Please remove eventCount to make the request compatible"). Each needs
// the item-scoped metric that matches the event it's reported against, so
// a coverage check on e.g. item_id for add_to_cart (not just purchase) has
// to route through itemsAddedToCart, not eventCount — shared between the
// worker (stored daily checks) and the live parameter-coverage endpoint so
// they can't silently diverge on which events/dimensions are handled.
export const ITEM_SCOPED_DIMENSIONS = new Set(['itemId', 'itemName', 'itemBrand', 'itemCategory', 'itemCategory2', 'itemCategory3', 'itemCategory4', 'itemCategory5', 'itemVariant'])
export const ITEM_METRIC_BY_EVENT: Record<string, string> = {
  view_item_list:    'itemListViewEvents',
  select_item:       'itemsClickedInList',
  view_item:         'itemsViewed',
  add_to_cart:       'itemsAddedToCart',
  begin_checkout:    'itemsCheckedOut',
  add_shipping_info: 'itemsCheckedOut',
  add_payment_info:  'itemsCheckedOut',
  purchase:          'itemsPurchased',
  view_promotion:    'itemListViewEvents',
  select_promotion:  'itemsClickedInPromotion',
}

// GA4_STANDARD_METRICS entries that are themselves item-scoped (price →
// itemRevenue, quantity → itemsAddedToCart). GA4 has no "(not set)" signal
// for a numeric metric the way it does for a dimension (a genuinely-zero
// value and a field that was never included both just report as 0) and, for
// an item-scoped field, there's no per-event-instance identifier to break a
// query down by either — unlike transactionId for purchase/refund, there's
// no equivalent "this specific item occurrence" id. So true per-event
// coverage isn't obtainable for these the way it is for text dimensions or
// transaction-bearing metrics; the best honest signal available is
// per-PRODUCT: of the distinct items that appeared, how many ever report
// this field at all (breaking the query down by itemId instead of by
// event). Shared so the worker and the live endpoint can't diverge on which
// metrics get this treatment.
export const ITEM_SCOPED_METRICS = new Set(['itemRevenue', 'itemsAddedToCart'])

// Events whose instances are reliably identified by their own transaction_id
// — purchase and refund. For a metric checked on one of these (value,
// shipping, tax), breaking the query down by transactionId gives TRUE
// per-event coverage (how many distinct transactions had this field vs.
// didn't), not an approximation. Events without their own id (begin_checkout,
// view_cart, add_to_wishlist, add_shipping_info, add_payment_info) have no
// equivalent and fall back to a coarser per-hour approximation.
export const TRANSACTION_SCOPED_EVENTS = new Set(['purchase', 'refund'])
