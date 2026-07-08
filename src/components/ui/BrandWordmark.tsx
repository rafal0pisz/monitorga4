// Wordmark using the same treatment as the standard Bettersteps logo:
// Poppins, bold italic, uppercase, tracked out. Two-tone — "Alert" in
// ink/white depending on surface, "GA4." in yellow — no animation.
// `dark` controls which surface it sits on: true = dark background
// (Alert renders white), false = light background (Alert renders ink).
export default function BrandWordmark({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
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
      <span style={{ color: dark ? '#ffffff' : '#1c2328' }}>Alert</span>
      <span style={{ color: '#fffd73' }}>GA4.</span>
    </span>
  )
}
