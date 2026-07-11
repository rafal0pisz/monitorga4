// Wordmark using the same treatment as the standard Bettersteps logo:
// Poppins, bold italic, uppercase, tracked out. `dark` controls which
// surface it sits on: true = dark background (renders white), false =
// light background (renders ink).
export default function BrandWordmark({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
  const color = dark ? '#ffffff' : '#1c2328'
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
        color,
      }}
    >
      <span>Alert</span>
      <span>GA4.</span>
    </span>
  )
}
