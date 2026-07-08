// Bettersteps-style logotype — mirrors the "BETTERSTEPS." wordmark:
// heavy black weight, slanted, uppercase, two-tone (light + yellow),
// using "ALERT" + "GA4" + a live-looking blinking dot.
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
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '-0.01em',
        lineHeight: 1,
        transform: 'skewX(-8deg)',
        transformOrigin: 'left center',
      }}
    >
      <span style={{ color: dark ? '#ffffff' : '#1c2328' }}>Alert</span>
      <span style={{ color: '#fffd73' }}>GA4</span>
      <span className="brand-wordmark-dot" style={{ color: '#fffd73' }}>.</span>
      <style>{`
        @keyframes brandWordmarkDotPulse {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(255,253,115,0.85), 0 0 18px rgba(255,253,115,0.45); }
          50% { opacity: 0.3; text-shadow: 0 0 0 rgba(255,253,115,0); }
        }
        .brand-wordmark-dot {
          display: inline-block;
          animation: brandWordmarkDotPulse 1.7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-wordmark-dot { animation: none; }
        }
      `}</style>
    </span>
  )
}
