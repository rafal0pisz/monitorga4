import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog/posts'

const SITE_URL = 'https://alertga4.pl'

export default function sitemap(): MetadataRoute.Sitemap {
  // Only published posts get a URL at all (getPostBySlug/page.tsx 404s
  // anything else) — "coming soon" cards on /blog have no link, so there's
  // nothing to list here for them.
  const posts = getPublishedPosts().map(p => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: p.publishedAt,
  }))

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/funkcje`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/cennik`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    ...posts,
  ]
}
