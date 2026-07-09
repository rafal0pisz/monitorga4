import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, Poppins } from 'next/font/google'
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

// Display face used only for the BrandWordmark logotype — matches the
// existing Bettersteps wordmark treatment (Poppins, bold italic, uppercase).
const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: '700',
  style: ['italic'],
  variable: '--font-logo',
  display: 'swap',
})

const SITE_URL = 'https://alertga4.bettersteps.pl'
const TITLE = 'AlertGA4 — monitoring jakości implementacji GA4'
const DESCRIPTION = 'AlertGA4 codziennie sprawdza implementację Google Analytics 4 pod kątem brakujących eventów, błędów śledzenia i anomalii, i wysyła alert zanim popsute dane trafią do raportów.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — AlertGA4',
  },
  description: DESCRIPTION,
  keywords: [
    'GA4', 'Google Analytics 4', 'monitoring GA4', 'jakość danych GA4',
    'audyt GA4', 'alerty GA4', 'śledzenie zdarzeń', 'analityka e-commerce',
  ],
  authors: [{ name: 'Bettersteps' }],
  creator: 'Bettersteps Sp. z o.o.',
  publisher: 'Bettersteps Sp. z o.o.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: SITE_URL,
    siteName: 'AlertGA4',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${plexSans.variable} ${plexMono.variable} ${poppins.variable}`}>
      <body style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)', fontFamily: 'var(--font-sans), -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
