// English translations of the blog, served under /en/blog/[slug] (see
// app/en/blog/[slug]/page.tsx). Kept as a separate module, not a field on
// the Polish BlogPost in posts.ts, because:
// - each translation is a full, independent article (own slug, own SEO
//   copy, own internal cross-links to other EN articles), not a small
//   per-field override of the Polish version;
// - one file per article (src/lib/blog/en/<slug>.ts) keeps each edit small
//   and avoids every translation landing in one multi-thousand-line file.
//
// The Polish BlogPost.enSlug field is the only link back from pl -> en,
// used for hreflang alternates and the language switcher on a given post.
// This module's own `plSlug` is the reverse link (en -> pl), used the same
// way from the English side.
export interface BlogPostEn {
  slug: string
  plSlug: string
  title: string
  excerpt: string
  targetPhrase: string
  status: 'published' | 'coming-soon'
  publishedAt?: string // ISO date (YYYY-MM-DD)
  bodyHtml?: string
  faqHtml?: string
  widget?: 'utm-builder'
}

export const BLOG_POSTS_EN: BlogPostEn[] = []

export function getPublishedPostsEn(): BlogPostEn[] {
  return BLOG_POSTS_EN
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

export function getPostBySlugEn(slug: string): BlogPostEn | undefined {
  return BLOG_POSTS_EN.find(p => p.slug === slug && p.status === 'published')
}
