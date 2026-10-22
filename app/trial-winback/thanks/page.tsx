import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'

export default function TrialWinbackThanksPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-tertiary)' }}>
      <div style={{ textAlign: 'center', padding: '0 20px', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <BrandWordmark size={22} />
        </div>
        <h1 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>Thanks for letting us know</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Your feedback helps us improve AlertGA4. If you change your mind, your welcome-back offer is still waiting.
        </p>
        <Link href="/cennik" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>View pricing →</Link>
      </div>
    </div>
  )
}
