import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Same chart motif as the homepage's final CTA band
// (src/components/marketing/LandingCtaBand.tsx + landingStyles.ts's
// .lp-cta-chart/.lp-cta-marker rules) — kept visually identical (same
// points, same colors) so the link-preview card and the site itself read
// as one design instead of the previous plain wordmark-on-navy card.
const CHART_POINTS = '0,47 100,45 200,50 300,42 400,47 500,41 540,44 580,105 630,102 720,78 820,61 920,50 1020,44 1080,41'

// next/og's ImageResponse renders in an isolated runtime that never sees the
// site's own next/font-loaded Poppins — without this it silently falls back
// to a thinner default typeface, which is why the card's wordmark looked
// lighter than BrandWordmark's actual Poppins 700 italic
// (src/components/ui/BrandWordmark.tsx) elsewhere on the site. Fetched at
// request time, subsetted to just the characters the wordmark uses.
// next/og's ImageResponse (satori) only accepts raw TTF/OTF font data, but
// Google Fonts' CSS endpoint serves woff2 to any modern User-Agent — this
// specific old-Android UA is a well-known trick to make it respond with
// plain TrueType instead, which is otherwise not directly selectable.
const LEGACY_UA = 'Mozilla/5.0 (Linux; U; Android 2.2) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'

async function loadGoogleFontTtf(cssUrl: string): Promise<ArrayBuffer> {
  const css = await (await fetch(cssUrl, { headers: { 'User-Agent': LEGACY_UA } })).text()
  const fontUrl = css.match(/src: url\(([^)]+)\) format\('truetype'\)/)?.[1]
  if (!fontUrl) throw new Error(`[opengraph-image] Could not resolve a TrueType font URL from: ${cssUrl}`)
  const fontRes = await fetch(fontUrl)
  return fontRes.arrayBuffer()
}

export default async function OpengraphImage() {
  const tagline = 'Codzienny monitoring danych w Google Analytics 4'
  const markerLabel = 'AlertGA4'

  // Two separate fonts, each requested by its own exact name below — not
  // just one "nice to have". Satori falls back to ANY registered custom
  // font (picking whichever has the needed glyph) for elements that don't
  // match a registered family by name, before it ever reaches its own true
  // built-in default. With only the wordmark's bold-italic Poppins loaded,
  // every capital A/G/T/4/. anywhere in the image — including inside the
  // tagline and the marker label — was silently rendered in that bold
  // italic face while the rest of those same words stayed in the default,
  // a visibly mixed result. Giving the body text its own exactly-matching
  // font (IBM Plex Sans — the site's own --font-sans, see app/layout.tsx)
  // means neither element is ever "unmatched", so that fallback path never
  // runs.
  const [poppinsBoldItalic, plexSansRegular] = await Promise.all([
    loadGoogleFontTtf(`https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,700&text=${encodeURIComponent('ALERTGA4.')}&display=swap`)
      .catch(err => { console.error('[opengraph-image] Poppins load failed, wordmark falls back to default font:', err instanceof Error ? err.message : err); return null }),
    loadGoogleFontTtf(`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans&text=${encodeURIComponent(tagline + markerLabel)}&display=swap`)
      .catch(err => { console.error('[opengraph-image] IBM Plex Sans load failed, body text falls back to default font:', err instanceof Error ? err.message : err); return null }),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#232b31',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: plexSansRegular ? 'PlexSans' : undefined,
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, fontFamily: poppinsBoldItalic ? 'Poppins' : undefined, fontWeight: 700, fontStyle: 'italic', letterSpacing: 5, marginTop: -40 }}>
          <span style={{ color: '#ffffff' }}>ALERT</span>
          <span style={{ color: '#fffd73' }}>GA4.</span>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: '#ffffff', textAlign: 'center' }}>
          {tagline}
        </div>

        <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 200 }}>
          <svg viewBox="0 0 1080 117" preserveAspectRatio="none" width="1200" height="200">
            <polygon points={`${CHART_POINTS} 1080,117 0,117`} fill="#fffd73" opacity="0.05" />
            <polyline points={CHART_POINTS} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: '53.7%', bottom: 13, transform: 'translateX(-50%)' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              fontWeight: 400,
              color: '#ffcccc',
              background: 'rgba(255,90,90,0.15)',
              border: '1.5px solid rgba(255,90,90,0.35)',
              padding: '5px 14px',
              borderRadius: 7,
              marginBottom: 10,
            }}
          >
            {markerLabel}
          </div>
          <div style={{ display: 'flex', width: 16, height: 16, borderRadius: '50%', background: '#ff5a5a' }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(poppinsBoldItalic ? [{ name: 'Poppins', data: poppinsBoldItalic, weight: 700 as const, style: 'italic' as const }] : []),
        ...(plexSansRegular ? [{ name: 'PlexSans', data: plexSansRegular, weight: 400 as const, style: 'normal' as const }] : []),
      ],
    }
  )
}
