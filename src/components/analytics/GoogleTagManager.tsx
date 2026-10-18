'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

const GTM_ID = 'GTM-KV5FTJFD'

// The authenticated app surface (behind Google login) stays untagged — GTM
// is for the public site and marketing funnel around it, not the app
// itself. Matches middleware.ts's own split between public and auth-gated
// paths.
const APP_PATH_PREFIXES = ['/dashboard', '/project', '/admin']

export default function GoogleTagManager() {
  const pathname = usePathname()
  if (APP_PATH_PREFIXES.some(prefix => pathname?.startsWith(prefix))) return null

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
