import type { MetadataRoute } from 'next'

const SITE_URL = 'https://alertga4.pl'

export default function robots(): MetadataRoute.Robots {
  // /cennik was missing from every rule below despite being a real, fully
  // indexable public page (sitemap.ts already lists it) — not a hard
  // block since nothing disallowed it either, just an inconsistency with
  // the "marketing/legal pages are public" intent these rules state.
  const PUBLIC_PATHS = ['/', '/privacy', '/terms', '/funkcje', '/cennik', '/kontakt']

  return {
    rules: [
      {
        // Marketing/legal pages are public; the app itself requires a
        // Google account, so there's nothing useful for a crawler beyond
        // login/auth/API routes and a signed-in user's own dashboard.
        userAgent: '*',
        allow: PUBLIC_PATHS,
        disallow: ['/dashboard', '/project', '/login', '/auth', '/api', '/share'],
      },
      // Explicitly welcome AI/LLM crawlers on the public marketing pages —
      // default '*' already allows them, but naming them avoids any doubt
      // and matches how these bots are commonly identified.
      { userAgent: 'GPTBot', allow: PUBLIC_PATHS },
      { userAgent: 'ChatGPT-User', allow: PUBLIC_PATHS },
      { userAgent: 'ClaudeBot', allow: PUBLIC_PATHS },
      { userAgent: 'anthropic-ai', allow: PUBLIC_PATHS },
      { userAgent: 'PerplexityBot', allow: PUBLIC_PATHS },
      { userAgent: 'Google-Extended', allow: PUBLIC_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
