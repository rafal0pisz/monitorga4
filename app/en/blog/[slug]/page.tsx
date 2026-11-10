import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import TrialPromoBanner from '@/components/marketing/TrialPromoBanner'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { getPostBySlugEn } from '@/lib/blog/posts.en'
import UtmBuilder from '@/components/blog/UtmBuilder'

const WIDGETS = { 'utm-builder': UtmBuilder } as const

interface Props { params: Promise<{ slug: string }> }

// Mirrors app/blog/[slug]/page.tsx — see that file for the reasoning behind
// the widget-marker split and the shared <style> block. Kept as a separate
// file rather than a parameterized shared component because every other
// /en/* page in this app follows that same one-file-per-language pattern
// (see app/funkcje vs app/en/features, etc.), not a shared component.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlugEn(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/en/blog/${post.slug}`,
      languages: { pl: `/blog/${post.plSlug}`, en: `/en/blog/${post.slug}`, 'x-default': `/en/blog/${post.slug}` },
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      siteName: 'AlertGA4',
      url: `https://alertga4.pl/en/blog/${post.slug}`,
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

export default async function BlogPostPageEn({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlugEn(slug)
  if (!post) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Sign up with Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Log in' }

  const Widget = post.widget ? WIDGETS[post.widget] : null
  const [bodyBefore, bodyAfter] = Widget ? (post.bodyHtml ?? '').split('<!--WIDGET-->') : [post.bodyHtml ?? '', '']

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'AlertGA4' },
    publisher: {
      '@type': 'Organization',
      name: 'Bettersteps Sp. z o.o.',
      url: 'https://www.bettersteps.pl',
    },
    mainEntityOfPage: `https://alertga4.pl/en/blog/${post.slug}`,
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

        .blog-post-hero { padding: 48px 0 8px; }
        .blog-post-hero .eyebrow { font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8b939a; margin-bottom: 14px; }
        .blog-post-hero h1 { font-size: clamp(24px, 3.6vw, 34px); letter-spacing: -0.01em; max-width: 760px; margin: 0 0 10px; }
        .blog-post-hero .meta { font-size: 12.5px; color: #8b939a; }

        .lp .wrap.blog-post-body { padding-top: 32px; padding-bottom: 80px; max-width: 720px; margin: 0 auto; }
        .blog-post-body h2 { font-size: clamp(19px, 2.2vw, 23px); margin: 36px 0 14px; letter-spacing: -0.01em; }
        .blog-post-body p { font-size: 15px; color: #3a4148; line-height: 1.75; margin: 0 0 16px; }
        .blog-post-body ul, .blog-post-body ol { font-size: 15px; color: #3a4148; line-height: 1.7; margin: 0 0 16px; padding-left: 26px; }
        .blog-post-body ul { list-style: disc; }
        .blog-post-body ol { list-style: decimal; }
        .blog-post-body li { margin-bottom: 10px; padding-left: 4px; }
        .blog-post-body li::marker { color: #16a34a; font-weight: 600; }
        .blog-post-body a { color: #16a34a; }
        .blog-post-body i { color: #5b6570; }

        .blog-post-body .blog-code { display: block; font-family: var(--font-mono), monospace; font-size: 13px; color: #232b31; background: #f3f6f7; border: 1px solid #e2e6e8; border-radius: 8px; padding: 12px 14px; margin: 0 0 16px; word-break: break-all; }

        .blog-post-body pre.blog-code-block { font-family: var(--font-mono), monospace; font-size: 12.5px; line-height: 1.65; color: #232b31; background: #f3f6f7; border: 1px solid #e2e6e8; border-radius: 8px; padding: 14px 16px; margin: 0 0 16px; overflow-x: auto; white-space: pre; }
        .blog-post-body pre.blog-code-block code { background: none; border: none; padding: 0; font-size: inherit; }

        .blog-figure { margin: 24px 0; }
        .blog-figure img { width: 100%; height: auto; border-radius: 12px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .blog-figure svg { width: 100%; height: auto; display: block; background: #fff; border-radius: 12px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .blog-figure figcaption { font-size: 12px; color: #8b939a; margin-top: 8px; text-align: center; }

        /* Dense product-screenshot photos (unlike the SVG diagrams) become
           unreadable once scaled down to a phone's content width — the
           dashboard's own small text shrinks well past legible size. Rather
           than re-crop the screenshots or build a pinch-zoom lightbox, wrap
           them in a plain link to the full-size image in a new tab, where
           the phone's native viewer/pinch-zoom works normally. */
        .blog-figure-zoom { display: block; position: relative; }
        .blog-figure-zoom img { cursor: zoom-in; }
        .blog-figure-zoom::after {
          content: 'Enlarge ⤢'; position: absolute; right: 10px; bottom: 10px;
          background: rgba(35,43,49,0.85); color: #fff; font-size: 11px; font-weight: 600;
          padding: 5px 10px; border-radius: 6px; pointer-events: none;
        }

        .blog-checklist { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 20px 22px; }
        .blog-checklist-head { font-size: 12px; font-weight: 700; color: #232b31; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 14px; }
        .blog-post-body .blog-checklist-list { list-style: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .blog-post-body .blog-checklist-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #3a4148; line-height: 1.5; margin: 0; padding-left: 0; }
        .blog-checklist-check { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }

        /* display:block + overflow-x:auto on the table itself (rather than
           wrapping every <table> in the raw content HTML with a div) makes
           a wide table scroll within its own box on narrow screens instead
           of forcing the whole page to scroll horizontally — tr/td keep
           their default table-row/table-cell display, so the browser still
           builds an anonymous table box internally and column alignment is
           unaffected. Needed because several tables have unbreakable
           tokens (items[].item_id, dates, code-like values) that are wider
           than a phone screen regardless of font size. */
        .blog-table { display: block; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 13.5px; }
        .blog-table th, .blog-table td { padding: 10px 14px; border: 1px solid #e2e6e8; text-align: left; vertical-align: top; }
        .blog-table th { background: #f3f6f7; font-weight: 600; }
        @media (max-width: 640px) {
          .blog-table { font-size: 12.5px; }
          .blog-table th, .blog-table td { padding: 8px 10px; }
        }

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

      <LandingNav
        primaryCta={primaryCta}
        user={!!user}
        lang="en"
        langHrefs={{ pl: `/blog/${post.plSlug}`, en: `/en/blog/${post.slug}` }}
      />

      <main>
        <div className="wrap blog-post-hero">
          <a href="/en/blog" className="blog-back">← Blog</a>
          <div style={{ height: 16 }} />
          <div className="eyebrow">AlertGA4 · Blog</div>
          <h1>{post.title}</h1>
          {post.publishedAt && <div className="meta">{new Date(post.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
        </div>

        <div className="wrap blog-post-body">
          <article>
            <div dangerouslySetInnerHTML={{ __html: bodyBefore }} />
            {Widget && <Widget lang="en" />}
            {bodyAfter && <div dangerouslySetInnerHTML={{ __html: bodyAfter }} />}
          </article>
          {!user && <TrialPromoBanner lang="en" />}
          {post.faqHtml && <div dangerouslySetInnerHTML={{ __html: post.faqHtml }} />}
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} lang="en" />
      </main>

      <LandingFooter lang="en" />
    </div>
  )
}
