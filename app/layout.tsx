import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GA4 Quality Score | monitor.bettersteps.pl',
  description: 'Monitoruj jakość implementacji GA4 swoich klientów',
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
