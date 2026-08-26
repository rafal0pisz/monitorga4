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
export const ITEM_SCOPED_DIMENSIONS = new Set(['itemId', 'itemName', 'itemBrand', 'itemCategory', 'itemVariant'])
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
