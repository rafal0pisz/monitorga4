import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlertGA4 — monitoring jakości implementacji GA4',
  description: 'AlertGA4 codziennie sprawdza implementację Google Analytics 4 pod kątem brakujących eventów, błędów śledzenia i anomalii, i wysyła alert zanim popsute dane trafią do raportów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
        {children}
      </body>
    </html>
  )
}
