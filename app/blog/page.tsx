import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { getAllPostsForIndex } from '@/lib/blog/posts'

const TITLE = 'Blog'
const DESCRIPTION = 'Artykuły o jakości danych w GA4: audyty, typowe błędy pomiarowe i jak je wykrywać, zanim trafią do raportu.'

// Soft-launched: live at /blog for anyone with the direct link, but not
// linked from the main nav (LandingNav's own NAV_LINKS) and not indexed
// yet — flip `index: true` here (and add it to app/robots.ts's
// PUBLIC_PATHS / app/sitemap.ts) once there's enough content to announce.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: '/blog' },
}

export default async function BlogIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Przejdź do panelu' }
    : { href: '/login', label: 'Zarejestruj się przez Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Zaloguj się' }

  const posts = getAllPostsForIndex()

  return (
    <div className="lp">
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
        .blog-card.is-soon { opacity: 0.6; }
        .blog-card-soon-tag { font-size: 10.5px; font-weight: 600; color: #8b939a; background: #f3f6f7; border: 1px solid #e2e6e8; border-radius: 999px; padding: 2px 9px; width: fit-content; }
      `}</style>

      <LandingNav primaryCta={primaryCta} user={!!user} />

      <main>
        <section className="blog-hero">
          <div className="wrap wrap--narrow">
            <h1>Blog AlertGA4</h1>
            <p>Praktyczne artykuły o jakości danych w GA4: typowe błędy pomiarowe, jak je wykrywać i co z nimi zrobić.</p>
          </div>
        </section>

        <div className="wrap blog-body">
          <div className="blog-grid">
            {posts.map(post => (
              <div key={post.slug} className={`blog-card${post.status === 'coming-soon' ? ' is-soon' : ''}`}>
                {post.status === 'coming-soon' && <span className="blog-card-soon-tag">Wkrótce</span>}
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                {post.status === 'published' && (
                  <Link href={`/blog/${post.slug}`} className="blog-card-link">Czytaj →</Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
