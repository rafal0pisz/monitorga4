import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlertGA4 — GA4 implementation quality monitor',
  description: 'AlertGA4 continuously checks your Google Analytics 4 implementation for missing events, tracking errors and anomalies, and alerts you before bad data reaches your reports.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
        {children}
      </body>
    </html>
  )
}
