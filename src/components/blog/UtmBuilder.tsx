'use client'

import { useMemo, useState } from 'react'

function normalizeUtmValue(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

const STRINGS = {
  pl: {
    urlLabel: 'Adres strony docelowej',
    urlPlaceholder: 'twojastrona.pl/oferta',
    sourcePlaceholder: 'np. newsletter, facebook',
    mediumPlaceholder: 'np. email, cpc, social',
    campaignPlaceholder: 'np. black-friday-2026',
    termLabel: 'utm_term (opcjonalnie)',
    termPlaceholder: 'słowo kluczowe kampanii płatnej',
    contentLabel: 'utm_content (opcjonalnie)',
    contentPlaceholder: 'np. baner-gorny, link-w-stopce',
    error: 'Podaj poprawny adres strony, np. twojastrona.pl/oferta',
    outputPlaceholder: 'Twój link z UTM pojawi się tutaj',
    copy: 'Kopiuj link',
    copied: 'Skopiowano',
    hint: 'Wartości parametrów są automatycznie zamieniane na małe litery, a spacje na myślniki. To jeden z najprostszych sposobów, żeby ta sama kampania nie rozjechała się w raportach GA4 na kilka osobnych wierszy.',
  },
  en: {
    urlLabel: 'Destination URL',
    urlPlaceholder: 'yoursite.com/offer',
    sourcePlaceholder: 'e.g. newsletter, facebook',
    mediumPlaceholder: 'e.g. email, cpc, social',
    campaignPlaceholder: 'e.g. black-friday-2026',
    termLabel: 'utm_term (optional)',
    termPlaceholder: 'paid campaign keyword',
    contentLabel: 'utm_content (optional)',
    contentPlaceholder: 'e.g. top-banner, footer-link',
    error: 'Enter a valid URL, e.g. yoursite.com/offer',
    outputPlaceholder: 'Your UTM link will appear here',
    copy: 'Copy link',
    copied: 'Copied',
    hint: 'Parameter values are automatically lowercased, with spaces turned into hyphens. It is one of the simplest ways to stop the same campaign from splitting into several separate rows in GA4 reports.',
  },
}

// Embedded inside the UTM blog article's body (see app/blog/[slug]/page.tsx
// and app/en/blog/[slug]/page.tsx, which split that post's bodyHtml on a
// marker and render this component in the gap). Pure client-side URL
// assembly, no backend call and nothing persisted — see the conversation
// decision to skip a public link shortener for this article (abuse-vector
// risk of an open redirect on the domain).
export default function UtmBuilder({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = STRINGS[lang]
  const [baseUrl, setBaseUrl] = useState('')
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  const [campaign, setCampaign] = useState('')
  const [term, setTerm] = useState('')
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  const { url, error } = useMemo(() => {
    const trimmedBase = baseUrl.trim()
    if (!trimmedBase) return { url: '', error: null as string | null }

    const withProtocol = /^https?:\/\//i.test(trimmedBase) ? trimmedBase : `https://${trimmedBase}`
    try {
      const parsed = new URL(withProtocol)
      if (source) parsed.searchParams.set('utm_source', normalizeUtmValue(source))
      if (medium) parsed.searchParams.set('utm_medium', normalizeUtmValue(medium))
      if (campaign) parsed.searchParams.set('utm_campaign', normalizeUtmValue(campaign))
      if (term) parsed.searchParams.set('utm_term', normalizeUtmValue(term))
      if (content) parsed.searchParams.set('utm_content', normalizeUtmValue(content))
      return { url: parsed.toString(), error: null as string | null }
    } catch {
      return { url: '', error: t.error }
    }
  }, [baseUrl, source, medium, campaign, term, content, t.error])

  async function handleCopy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API blocked (older browser, insecure context) — the
      // output field itself is still selectable for a manual copy.
    }
  }

  const ready = !!url && !error

  return (
    <div className="blog-utm-builder">
      <div className="blog-utm-grid">
        <label className="blog-utm-field blog-utm-field--wide">
          <span>{t.urlLabel}</span>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder={t.urlPlaceholder} />
        </label>
        <label className="blog-utm-field">
          <span>utm_source</span>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder={t.sourcePlaceholder} />
        </label>
        <label className="blog-utm-field">
          <span>utm_medium</span>
          <input type="text" value={medium} onChange={e => setMedium(e.target.value)} placeholder={t.mediumPlaceholder} />
        </label>
        <label className="blog-utm-field">
          <span>utm_campaign</span>
          <input type="text" value={campaign} onChange={e => setCampaign(e.target.value)} placeholder={t.campaignPlaceholder} />
        </label>
        <label className="blog-utm-field">
          <span>{t.termLabel}</span>
          <input type="text" value={term} onChange={e => setTerm(e.target.value)} placeholder={t.termPlaceholder} />
        </label>
        <label className="blog-utm-field blog-utm-field--wide">
          <span>{t.contentLabel}</span>
          <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder={t.contentPlaceholder} />
        </label>
      </div>

      {error && <div className="blog-utm-error">{error}</div>}

      <div className="blog-utm-output">
        <input
          type="text"
          value={url}
          readOnly
          placeholder={t.outputPlaceholder}
          onFocus={e => e.target.select()}
        />
        <button type="button" onClick={handleCopy} disabled={!ready}>
          {copied ? t.copied : t.copy}
        </button>
      </div>

      <p className="blog-utm-hint">{t.hint}</p>
    </div>
  )
}
