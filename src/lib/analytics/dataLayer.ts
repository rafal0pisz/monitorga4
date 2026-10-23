// Thin wrapper around GTM's dataLayer.push — used only from client
// components, and only on pages where <GoogleTagManager> actually loads
// (see its own APP_PATH_PREFIXES/TRACKED_EXCEPTIONS split). Pushing on an
// excluded page is harmless (it just queues into an array nothing ever
// reads) but won't reach GTM, so callers should only fire this from a page
// that's confirmed to carry the GTM script.
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function pushDataLayerEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
