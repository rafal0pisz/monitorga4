import type { MetadataRoute } from 'next'

const SITE_URL = 'https://alertga4.bettersteps.pl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Marketing/legal pages are public; the app itself requires a
        // Google account, so there's nothing useful for a crawler beyond
        // login/auth/API routes and a signed-in user's own dashboard.
        userAgent: '*',
        allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'],
        disallow: ['/dashboard', '/project', '/login', '/auth', '/api', '/share'],
      },
      // Explicitly welcome AI/LLM crawlers on the public marketing pages —
      // default '*' already allows them, but naming them avoids any doubt
      // and matches how these bots are commonly identified.
      { userAgent: 'GPTBot', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
      { userAgent: 'ChatGPT-User', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
      { userAgent: 'ClaudeBot', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
      { userAgent: 'anthropic-ai', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
      { userAgent: 'PerplexityBot', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
      { userAgent: 'Google-Extended', allow: ['/', '/privacy', '/terms', '/funkcje', '/kontakt'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
