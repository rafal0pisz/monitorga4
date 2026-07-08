import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, Archivo_Black } from 'next/font/google'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

// Heavy display face used only for the BrandWordmark logotype — IBM Plex
// Sans' boldest cut (700) still read too light against the reference
// "BETTERSTEPS." logo, which needs a genuine black/900-weight grotesk.
const archivoBlack = Archivo_Black({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-logo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AlertGA4 — monitoring jakości implementacji GA4',
  description: 'AlertGA4 codziennie sprawdza implementację Google Analytics 4 pod kątem brakujących eventów, błędów śledzenia i anomalii, i wysyła alert zanim popsute dane trafią do raportów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${plexSans.variable} ${plexMono.variable} ${archivoBlack.variable}`}>
      <body style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)', fontFamily: 'var(--font-sans), -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
