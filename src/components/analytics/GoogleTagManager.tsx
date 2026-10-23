'use client'

import Script from 'next/script'

const GTM_ID = 'GTM-KV5FTJFD'

// Loaded on every page, including the authenticated app (dashboard/project/
// admin) — this only ever sees what the app explicitly pushes to
// dataLayer (trial_click, sign_up, purchase, exception — see
// src/lib/analytics/) or reads off the URL/DOM via a configured GTM
// variable; it has no access to the GA4 report data itself (fetched
// server-side from Google's API, never put in page content GTM could read).
// Was previously excluded from /dashboard, /project and /admin, with
// path-specific exceptions carved out for the handful of pages that needed
// an event — removed once that distinction stopped mattering.
export default function GoogleTagManager() {
  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}
