import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { getPublishedPostsEn } from '@/lib/blog/posts.en'

const TITLE = 'Blog'
const DESCRIPTION = 'Articles on GA4 data quality: audits, common measurement errors, and how to catch them before they reach a report.'

// Mirrors /blog (see that page's own comment): indexable and in the
// sitemap, linked only from the footer, not the main nav.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/en/blog',
    languages: { pl: '/blog', en: '/en/blog', 'x-default': '/en/blog' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/en/blog',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
}

export default async function BlogIndexPageEn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Sign up with Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Log in' }

  const publishedPosts = getPublishedPostsEn()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AlertGA4 Blog',
    description: DESCRIPTION,
    url: 'https://alertga4.pl/en/blog',
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'Bettersteps Sp. z o.o.', url: 'https://www.bettersteps.pl' },
    blogPost: publishedPosts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://alertga4.pl/en/blog/${p.slug}`,
      datePublished: p.publishedAt,
    })),
  }

  return (
    <div className="lp">
      <SetHtmlLang lang="en" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <style>{`
        ${LANDING_BASE_STYLES}

        .blog-hero { padding: 56px 0 36px; text-align: center; }
        .blog-hero h1 { font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.01em; margin-bottom: 12px; }
        .blog-hero p { font-size: 15.5px; color: #5b6570; max-width: 560px; margin: 0 auto; line-height: 1.6; }

        .blog-body { padding: 8px 0 88px; }
        .blog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 760px) { .blog-grid { grid-template-columns: 1fr; } }

        .blog-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
        .blog-card h2 { font-size: 17px; line-height: 1.35; margin: 0; }
        .blog-card p { font-size: 13.5px; color: #5b6570; line-height: 1.6; margin: 0; flex: 1; }
        .blog-card a.blog-card-link { font-size: 13px; font-weight: 600; color: #16a34a; text-decoration: none; }
        .blog-card a.blog-card-link:hover { text-decoration: underline; }
      `}</style>

      <LandingNav primaryCta={primaryCta} user={!!user} lang="en" routeKey="blog" />

      <main>
        <section className="blog-hero">
          <div className="wrap wrap--narrow">
            <h1>AlertGA4 Blog</h1>
            <p>Practical articles on GA4 data quality: common measurement errors, how to catch them, and what to do about them.</p>
          </div>
        </section>

        <div className="wrap blog-body">
          <div className="blog-grid">
            {publishedPosts.map(post => (
              <div key={post.slug} className="blog-card">
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <Link href={`/en/blog/${post.slug}`} className="blog-card-link">Read →</Link>
              </div>
            ))}
          </div>
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} lang="en" />
      </main>

      <LandingFooter lang="en" />
    </div>
  )
}
