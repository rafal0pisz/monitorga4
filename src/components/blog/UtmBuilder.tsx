'use client'

import { useMemo, useState } from 'react'

function normalizeUtmValue(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

// Embedded inside the UTM blog article's body (see app/blog/[slug]/page.tsx,
// which splits that post's bodyHtml on a marker and renders this component
// in the gap). Pure client-side URL assembly, no backend call and nothing
// persisted — see the conversation decision to skip a public link shortener
// for this article (abuse-vector risk of an open redirect on the domain).
export default function UtmBuilder() {
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
      return { url: '', error: 'Podaj poprawny adres strony, np. twojastrona.pl/oferta' }
    }
  }, [baseUrl, source, medium, campaign, term, content])

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
          <span>Adres strony docelowej</span>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="twojastrona.pl/oferta" />
        </label>
        <label className="blog-utm-field">
          <span>utm_source</span>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="np. newsletter, facebook" />
        </label>
        <label className="blog-utm-field">
          <span>utm_medium</span>
          <input type="text" value={medium} onChange={e => setMedium(e.target.value)} placeholder="np. email, cpc, social" />
        </label>
        <label className="blog-utm-field">
          <span>utm_campaign</span>
          <input type="text" value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="np. black-friday-2026" />
        </label>
        <label className="blog-utm-field">
          <span>utm_term (opcjonalnie)</span>
          <input type="text" value={term} onChange={e => setTerm(e.target.value)} placeholder="słowo kluczowe kampanii płatnej" />
        </label>
        <label className="blog-utm-field blog-utm-field--wide">
          <span>utm_content (opcjonalnie)</span>
          <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="np. baner-gorny, link-w-stopce" />
        </label>
      </div>

      {error && <div className="blog-utm-error">{error}</div>}

      <div className="blog-utm-output">
        <input
          type="text"
          value={url}
          readOnly
          placeholder="Twój link z UTM pojawi się tutaj"
          onFocus={e => e.target.select()}
        />
        <button type="button" onClick={handleCopy} disabled={!ready}>
          {copied ? 'Skopiowano' : 'Kopiuj link'}
        </button>
      </div>

      <p className="blog-utm-hint">
        Wartości parametrów są automatycznie zamieniane na małe litery, a spacje na myślniki.
        To jeden z najprostszych sposobów, żeby ta sama kampania nie rozjechała się w raportach GA4 na kilka osobnych wierszy.
      </p>
    </div>
  )
}
