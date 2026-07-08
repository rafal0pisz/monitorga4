// Bettersteps-style logotype: bold italic, two-tone, with a pulsing dot —
// mirrors the "BETTERSTEPS." wordmark (white/grey + yellow) using
// "Alert" (dark) + "GA4" (yellow) + a live-looking blinking dot.
export default function BrandWordmark({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontSize: size,
        fontWeight: 800,
        fontStyle: 'italic',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        transform: 'scaleX(0.94)',
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
