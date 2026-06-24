'use client'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 40, maxWidth: 700, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 24 }}>
        <h2 style={{ color: '#dc2626', margin: '0 0 12px', fontSize: 16 }}>Server Error</h2>
        <div style={{ marginBottom: 8 }}>
          <strong>Digest:</strong> {error.digest ?? 'none'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Message:</strong> {error.message || '(check Vercel function logs)'}
        </div>
        <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    </div>
  )
}
