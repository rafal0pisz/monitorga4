'use client'

import { useEffect } from 'react'

// The root layout (app/layout.tsx) hardcodes <html lang="pl"> for the whole
// app — correct for the Polish marketing site and irrelevant for the
// already-English dashboard, but wrong for these /en/* pages. Giving every
// route its own <html> would require splitting the entire app (dashboard,
// auth, API routes included) into separate Next.js root layouts, which is
// a much bigger, riskier change than six new marketing pages justify.
// This is the deliberate, low-risk compromise: it fixes the attribute for
// real browsers/screen readers after hydration. Search engines rely on the
// hreflang annotations and the actual page content/URL, not this attribute,
// for language detection, so the brief SSR mismatch doesn't affect SEO.
export default function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const prev = document.documentElement.lang
    document.documentElement.lang = lang
    return () => { document.documentElement.lang = prev }
  }, [lang])
  return null
}
