import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
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
          borderRadius: 7,
        }}
      >
        <span style={{ color: '#fffd73', fontSize: 20, fontWeight: 700, fontStyle: 'italic' }}>A</span>
      </div>
    ),
    { ...size }
  )
}
