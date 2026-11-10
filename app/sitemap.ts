import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog/posts'
import { getPublishedPostsEn } from '@/lib/blog/posts.en'
import { LOCALE_ROUTES } from '@/lib/i18n/routes'

const SITE_URL = 'https://alertga4.pl'

// Each translated page's entry carries `alternates.languages` pointing at
// its sibling in the other language — the sitemap-level equivalent of the
// hreflang tags each page's own metadata declares, so a crawler gets the
// pl/en pairing however it reaches the page.
function localizedEntries(
  key: keyof typeof LOCALE_ROUTES,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap {
  const { pl, en } = LOCALE_ROUTES[key]
  const languages = { pl: `${SITE_URL}${pl}`, en: `${SITE_URL}${en}` }
  return [
    { url: `${SITE_URL}${pl}`, changeFrequency, priority, alternates: { languages } },
    { url: `${SITE_URL}${en}`, changeFrequency, priority, alternates: { languages } },
  ]
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Only published posts get a URL at all (getPostBySlug/page.tsx 404s
  // anything else) — "coming soon" cards on /blog have no link, so there's
  // nothing to list here for them.
  //
  // A pl post with an enSlug gets a reciprocal hreflang pair with its en/
  // translation, same as localizedEntries below; one without (not yet
  // translated) gets a plain, unpaired entry. Every en post always has a
  // plSlug, so it always pairs back.
  const plPosts = getPublishedPosts()
  const enPosts = getPublishedPostsEn()
  const enBySlug = new Map(enPosts.map(p => [p.slug, p]))

  const plPostEntries = plPosts.map(p => {
    const en = p.enSlug ? enBySlug.get(p.enSlug) : undefined
    return {
      url: `${SITE_URL}/blog/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: p.publishedAt,
      ...(en && {
        alternates: {
          languages: { pl: `${SITE_URL}/blog/${p.slug}`, en: `${SITE_URL}/en/blog/${en.slug}` },
        },
      }),
    }
  })

  const enPostEntries = enPosts.map(p => ({
    url: `${SITE_URL}/en/blog/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: p.publishedAt,
    alternates: {
      languages: { pl: `${SITE_URL}/blog/${p.plSlug}`, en: `${SITE_URL}/en/blog/${p.slug}` },
    },
  }))

  return [
    ...localizedEntries('home', 'weekly', 1),
    ...localizedEntries('features', 'monthly', 0.8),
    ...localizedEntries('pricing', 'monthly', 0.8),
    ...localizedEntries('contact', 'yearly', 0.5),
    ...localizedEntries('privacy', 'yearly', 0.3),
    ...localizedEntries('terms', 'yearly', 0.3),
    ...localizedEntries('blog', 'weekly', 0.7),
    ...plPostEntries,
    ...enPostEntries,
  ]
}
