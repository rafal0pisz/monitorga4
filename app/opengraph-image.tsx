import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Same chart motif as the homepage's final CTA band
// (src/components/marketing/LandingCtaBand.tsx + landingStyles.ts's
// .lp-cta-chart/.lp-cta-marker rules) — kept visually identical (same
// points, same colors) so the link-preview card and the site itself read
// as one design instead of the previous plain wordmark-on-navy card.
const CHART_POINTS = '0,47 100,45 200,50 300,42 400,47 500,41 540,44 580,105 630,102 720,78 820,61 920,50 1020,44 1080,41'

export default function OpengraphImage() {
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
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, fontStyle: 'italic', letterSpacing: -2, marginTop: -40 }}>
          <span style={{ color: '#ffffff' }}>Alert</span>
          <span style={{ color: '#fffd73' }}>GA4.</span>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          Codzienny monitoring danych w Google Analytics 4
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
              fontWeight: 600,
              color: '#ffcccc',
              background: 'rgba(255,90,90,0.15)',
              border: '1.5px solid rgba(255,90,90,0.35)',
              padding: '5px 14px',
              borderRadius: 7,
              marginBottom: 10,
            }}
          >
            AlertGA4
          </div>
          <div style={{ display: 'flex', width: 16, height: 16, borderRadius: '50%', background: '#ff5a5a' }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
