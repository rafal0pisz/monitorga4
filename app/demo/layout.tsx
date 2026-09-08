import type { Metadata } from 'next'
import DemoSidebar from '@/components/demo/DemoSidebar'

export const metadata: Metadata = {
  title: 'Demo Dashboard — AlertGA4',
  robots: { index: false, follow: false },
}

// No auth check, deliberately — this is the public "try before you log in"
// dashboard, wired to fixed example data (src/lib/demo/data.ts) instead of
// Supabase/GA4. Same shell as app/dashboard/layout.tsx otherwise.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <DemoSidebar />
      <main className="app-main" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
