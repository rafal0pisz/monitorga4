'use client'

import { useMemo, useState } from 'react'

function normalizeUtmValue(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

// Approximates GA4's Default channel group assignment from utm_source /
// utm_medium / utm_campaign. Google documents the channel list and example
// source/medium values but doesn't publish the exact matching regex, so
// this covers the well-documented, high-confidence cases in roughly GA4's
// own priority order — not a guaranteed 1:1 reproduction of the real
// engine. The article text around this widget says so explicitly and
// points readers at GA4's own Traffic acquisition report to confirm.
const SEARCH_SOURCES = ['google', 'bing', 'yahoo', 'baidu', 'duckduckgo', 'ecosia', 'yandex', 'naver', 'ask']
const SOCIAL_SOURCES = ['facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok', 'twitter', 'x', 'snapchat', 'reddit', 'quora', 'vk', 'tumblr', 'threads']
const VIDEO_SOURCES = ['youtube', 'vimeo', 'twitch', 'dailymotion']
const SHOPPING_SOURCES = ['google shopping', 'amazon', 'ebay', 'etsy']

const PAID_MEDIUMS = ['cpc', 'ppc', 'paidsearch', 'paid-search', 'paid_search', 'paidsocial', 'paid-social', 'paid_social', 'paidshopping', 'paid-shopping', 'paid_shopping', 'paid', 'retargeting']
const DISPLAY_MEDIUMS = ['display', 'banner', 'cpm', 'expandable', 'interstitial']
const EMAIL_MEDIUMS = ['email', 'e-mail', 'e_mail']
const AFFILIATE_MEDIUMS = ['affiliate', 'affiliates']
const REFERRAL_MEDIUMS = ['referral']
const SOCIAL_MEDIUMS = ['social', 'social-network', 'social_network', 'social-media', 'social_media', 'sm']
const AUDIO_MEDIUMS = ['audio']

function classifyChannel(sourceRaw: string, mediumRaw: string, campaignRaw: string): string {
  const source = sourceRaw.trim().toLowerCase()
  const medium = mediumRaw.trim().toLowerCase()
  const campaign = campaignRaw.trim().toLowerCase()

  if (campaign.includes('cross-network') || campaign.includes('cross network')) return 'Cross-network'
  if (!source && !medium) return 'Direct'
  if (EMAIL_MEDIUMS.includes(medium) || source === 'email') return 'Email'
  if (AFFILIATE_MEDIUMS.includes(medium)) return 'Affiliates'
  if (medium === 'sms' || source === 'sms') return 'SMS'
  if (AUDIO_MEDIUMS.includes(medium)) return 'Audio'
  if (medium.includes('push') || medium.includes('mobile') || medium.includes('notification')) return 'Mobile Push Notifications'

  const isPaidMedium = PAID_MEDIUMS.includes(medium) || medium.startsWith('paid')
  if (isPaidMedium) {
    if (SHOPPING_SOURCES.includes(source)) return 'Paid Shopping'
    if (SEARCH_SOURCES.includes(source)) return 'Paid Search'
    if (SOCIAL_SOURCES.includes(source)) return 'Paid Social'
    if (VIDEO_SOURCES.includes(source)) return 'Paid Video'
    return 'Paid Other'
  }

  if (DISPLAY_MEDIUMS.includes(medium)) return 'Display'

  if (medium === 'organic') {
    if (SHOPPING_SOURCES.includes(source)) return 'Organic Shopping'
    if (SEARCH_SOURCES.includes(source)) return 'Organic Search'
    if (SOCIAL_SOURCES.includes(source)) return 'Organic Social'
    if (VIDEO_SOURCES.includes(source)) return 'Organic Video'
  }

  if (SOCIAL_MEDIUMS.includes(medium) || SOCIAL_SOURCES.includes(source)) return 'Organic Social'
  if (REFERRAL_MEDIUMS.includes(medium)) return 'Referral'
  if (source && !medium) return 'Referral'

  return 'Unassigned'
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
    channelLabel: 'Taki ruch trafi do domyślnego kanału:',
    channelHint: 'Uproszczony podgląd na podstawie udokumentowanych przez Google reguł. Wynik zawsze warto zweryfikować w raporcie pozyskania w GA4, po tym jak ruch faktycznie napłynie.',
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
    channelLabel: 'This traffic will be assigned to the default channel:',
    channelHint: "A simplified preview based on Google's documented rules. It's always worth confirming the result in GA4's own Traffic acquisition report once real traffic starts coming in.",
  },
}

const SOURCE_SUGGESTIONS = ['google', 'bing', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'newsletter']
const MEDIUM_SUGGESTIONS = ['cpc', 'organic', 'email', 'social', 'paid-social', 'referral', 'affiliate', 'display', 'sms', 'audio']

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

  const channel = useMemo(() => classifyChannel(source, medium, campaign), [source, medium, campaign])

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
          <input type="text" list="utm-source-suggestions" value={source} onChange={e => setSource(e.target.value)} placeholder={t.sourcePlaceholder} />
        </label>
        <label className="blog-utm-field">
          <span>utm_medium</span>
          <input type="text" list="utm-medium-suggestions" value={medium} onChange={e => setMedium(e.target.value)} placeholder={t.mediumPlaceholder} />
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

      <datalist id="utm-source-suggestions">
        {SOURCE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="utm-medium-suggestions">
        {MEDIUM_SUGGESTIONS.map(m => <option key={m} value={m} />)}
      </datalist>

      <div className="blog-utm-channel">
        <span className="blog-utm-channel-label">{t.channelLabel}</span>
        <span className={`blog-utm-channel-value${channel === 'Unassigned' ? ' blog-utm-channel-value--warning' : channel === 'Direct' ? ' blog-utm-channel-value--neutral' : ''}`}>
          {channel}
        </span>
      </div>
      <p className="blog-utm-hint">{t.channelHint}</p>

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
