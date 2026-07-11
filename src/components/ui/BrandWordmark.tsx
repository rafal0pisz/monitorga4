// Wordmark using the same treatment as the standard Bettersteps logo:
// Poppins, bold italic, uppercase, tracked out. `dark` controls which
// surface it sits on: true = dark background (Alert renders white), false =
// light background (Alert renders ink). Two-tone by default — "GA4." in
// yellow — which only reads well against the dark marketing-page surfaces
// it was designed for; `mono` (used in the dashboard sidebar, a light
// surface) drops the yellow so it matches Alert's color instead.
export default function BrandWordmark({ size = 20, dark = false, mono = false }: { size?: number; dark?: boolean; mono?: boolean }) {
  const inkColor = dark ? '#ffffff' : '#1c2328'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontSize: size,
        fontFamily: 'var(--font-logo), sans-serif',
        fontWeight: 700,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: inkColor }}>Alert</span>
      <span style={{ color: mono ? inkColor : '#fffd73' }}>GA4.</span>
    </span>
  )
}
