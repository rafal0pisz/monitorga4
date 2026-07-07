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
