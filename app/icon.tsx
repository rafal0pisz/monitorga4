import { ImageResponse } from 'next/og'

// 48x48, not 32x32: Google requires the favicon it shows in search results
// to be a multiple of 48px (48, 96, 144...) and square — a 32x32 icon
// displays fine in a browser tab but is silently skipped by Google Search.
// https://developers.google.com/search/docs/appearance/favicon-in-search
export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#232b31',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
        }}
      >
        <span style={{ color: '#fffd73', fontSize: 30, fontWeight: 700, fontStyle: 'italic' }}>A</span>
      </div>
    ),
    { ...size }
  )
}
