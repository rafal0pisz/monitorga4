import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, fontStyle: 'italic', letterSpacing: -2 }}>
          <span style={{ color: '#ffffff' }}>Alert</span>
          <span style={{ color: '#fffd73' }}>GA4.</span>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          Codzienny monitoring danych w Google Analytics 4
        </div>
      </div>
    ),
    { ...size }
  )
}
