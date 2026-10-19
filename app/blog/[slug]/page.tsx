import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { getPostBySlug } from '@/lib/blog/posts'

interface Props { params: Promise<{ slug: string }> }

// Soft-launched, same as /blog itself: reachable by direct link, not
// indexed yet. Flip `index: true` once this post is ready to announce.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    robots: { index: false, follow: false },
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      locale: 'pl_PL',
      siteName: 'AlertGA4',
      url: `https://alertga4.pl/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Przejdź do panelu' }
    : { href: '/login', label: 'Zarejestruj się przez Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Zaloguj się' }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    inLanguage: 'pl',
    author: { '@type': 'Organization', name: 'AlertGA4' },
    publisher: {
      '@type': 'Organization',
      name: 'Bettersteps Sp. z o.o.',
      url: 'https://www.bettersteps.pl',
    },
    mainEntityOfPage: `https://alertga4.pl/blog/${post.slug}`,
  }

  return (
    <div className="lp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <style>{`
        ${LANDING_BASE_STYLES}

        .blog-post-hero { padding: 48px 0 8px; }
        .blog-post-hero .eyebrow { font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8b939a; margin-bottom: 14px; }
        .blog-post-hero h1 { font-size: clamp(24px, 3.6vw, 34px); letter-spacing: -0.01em; max-width: 760px; margin: 0 0 10px; }
        .blog-post-hero .meta { font-size: 12.5px; color: #8b939a; }

        .blog-post-body { padding: 32px 0 80px; max-width: 720px; margin: 0 auto; }
        .blog-post-body h2 { font-size: clamp(19px, 2.2vw, 23px); margin: 36px 0 14px; letter-spacing: -0.01em; }
        .blog-post-body p { font-size: 15px; color: #3a4148; line-height: 1.75; margin: 0 0 16px; }
        .blog-post-body ul, .blog-post-body ol { font-size: 15px; color: #3a4148; line-height: 1.7; margin: 0 0 16px; padding-left: 22px; }
        .blog-post-body li { margin-bottom: 8px; }
        .blog-post-body a { color: #16a34a; }
        .blog-post-body i { color: #5b6570; }

        .blog-figure { margin: 24px 0; }
        .blog-figure img { width: 100%; height: auto; border-radius: 12px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .blog-figure figcaption { font-size: 12px; color: #8b939a; margin-top: 8px; text-align: center; }

        .blog-table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 13.5px; }
        .blog-table th, .blog-table td { padding: 10px 14px; border: 1px solid #e2e6e8; text-align: left; vertical-align: top; }
        .blog-table th { background: #f3f6f7; font-weight: 600; }

        .blog-back { font-size: 13px; color: #5b6570; text-decoration: none; }
        .blog-back:hover { color: #232b31; }
      `}</style>

      <LandingNav primaryCta={primaryCta} user={!!user} />

      <main>
        <div className="wrap blog-post-hero">
          <a href="/blog" className="blog-back">← Blog</a>
          <div style={{ height: 16 }} />
          <div className="eyebrow">AlertGA4 · Blog</div>
          <h1>{post.title}</h1>
          {post.publishedAt && <div className="meta">{new Date(post.publishedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
        </div>

        <article className="wrap blog-post-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml ?? '' }} />

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
