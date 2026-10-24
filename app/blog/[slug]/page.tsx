import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import TrialPromoBanner from '@/components/marketing/TrialPromoBanner'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { getPostBySlug } from '@/lib/blog/posts'

interface Props { params: Promise<{ slug: string }> }

// Soft-launched, same as /blog itself: indexable and in the sitemap so
// Google can rank it, but not yet linked from the nav — see /blog's page.tsx.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    robots: { index: true, follow: true },
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

        /* ".lp .wrap" (landingStyles.ts) sets max-width:1120px and side
           padding at specificity (0,2,0) — higher than a bare
           ".blog-post-body" (0,1,0), which silently lost this whole rule and
           rendered the article at the full 1120px width instead of a
           readable column. ".lp .wrap.blog-post-body" (0,3,0) wins outright. */
        .lp .wrap.blog-post-body { padding: 32px 0 80px; max-width: 720px; margin: 0 auto; }
        .blog-post-body h2 { font-size: clamp(19px, 2.2vw, 23px); margin: 36px 0 14px; letter-spacing: -0.01em; }
        .blog-post-body p { font-size: 15px; color: #3a4148; line-height: 1.75; margin: 0 0 16px; }
        .blog-post-body ul, .blog-post-body ol { font-size: 15px; color: #3a4148; line-height: 1.7; margin: 0 0 16px; padding-left: 26px; }
        .blog-post-body ul { list-style: disc; }
        .blog-post-body ol { list-style: decimal; }
        .blog-post-body li { margin-bottom: 10px; padding-left: 4px; }
        .blog-post-body li::marker { color: #16a34a; font-weight: 600; }
        .blog-post-body a { color: #16a34a; }
        .blog-post-body i { color: #5b6570; }

        .blog-figure { margin: 24px 0; }
        .blog-figure img { width: 100%; height: auto; border-radius: 12px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .blog-figure svg { width: 100%; height: auto; display: block; background: #fff; border-radius: 12px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .blog-figure figcaption { font-size: 12px; color: #8b939a; margin-top: 8px; text-align: center; }

        .blog-checklist { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 20px 22px; }
        .blog-checklist-head { font-size: 12px; font-weight: 700; color: #232b31; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 14px; }
        .blog-post-body .blog-checklist-list { list-style: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .blog-post-body .blog-checklist-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #3a4148; line-height: 1.5; margin: 0; padding-left: 0; }
        .blog-checklist-check { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }

        .blog-table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 13.5px; }
        .blog-table th, .blog-table td { padding: 10px 14px; border: 1px solid #e2e6e8; text-align: left; vertical-align: top; }
        .blog-table th { background: #f3f6f7; font-weight: 600; }

        .blog-faq { display: flex; flex-direction: column; gap: 10px; margin: 8px 0 24px; }
        .blog-faq-item { background: #fff; border: 1px solid #e2e6e8; border-radius: 12px; padding: 0; overflow: hidden; }
        .blog-faq-item summary {
          list-style: none; cursor: pointer; padding: 16px 44px 16px 18px; position: relative;
          font-size: 14.5px; font-weight: 600; color: #232b31; line-height: 1.5;
        }
        .blog-faq-item summary::-webkit-details-marker { display: none; }
        .blog-faq-item summary::after {
          content: '+'; position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          font-size: 20px; font-weight: 400; color: #8b939a; transition: transform 0.15s;
        }
        .blog-faq-item[open] summary::after { transform: translateY(-50%) rotate(45deg); }
        .blog-faq-item[open] summary { border-bottom: 1px solid #e2e6e8; }
        .blog-faq-answer { padding: 14px 18px 18px; }
        .blog-faq-answer p { margin: 0; font-size: 14px; }

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

        <div className="wrap blog-post-body">
          <article dangerouslySetInnerHTML={{ __html: post.bodyHtml ?? '' }} />
          {!user && <TrialPromoBanner />}
          {post.faqHtml && <div dangerouslySetInnerHTML={{ __html: post.faqHtml }} />}
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
