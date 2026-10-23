'use client'

import { useEffect } from 'react'
import { pushDataLayerEvent } from '@/lib/analytics/dataLayer'

export default function PurchaseEventPusher(props: {
  transactionId: string
  value: number
  currency: string
  planId: string
  planName: string
}) {
  useEffect(() => {
    // Guards against double-counting the same purchase — this page can be
    // revisited (back button, refresh, bookmarked link) with the same
    // session_id, which would otherwise fire a second identical purchase
    // event every time. Keyed per tab/session, not per browser, which is
    // the right scope here (a different tab re-landing here legitimately
    // wouldn't be a second purchase either, but that's an edge case not
    // worth more machinery for).
    const key = `ga4_purchase_sent_${props.transactionId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage unavailable (private mode, blocked) — fall through
      // and fire anyway rather than silently never tracking the purchase.
    }

    // GA4's documented ecommerce shape nests these fields under
    // "ecommerce" (what GTM's built-in Ecommerce variable and a GA4 Event
    // tag's "Send Ecommerce Data" option both read from) — a flat push
    // would be invisible to that mechanism. Clearing it first matches
    // Google's own recommended pattern, in case GTM or a prior page left a
    // stale ecommerce object around.
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ ecommerce: null })
    }
    pushDataLayerEvent('purchase', {
      ecommerce: {
        transaction_id: props.transactionId,
        value: props.value,
        currency: props.currency,
        items: [{ item_id: props.planId, item_name: props.planName, price: props.value, quantity: 1 }],
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
