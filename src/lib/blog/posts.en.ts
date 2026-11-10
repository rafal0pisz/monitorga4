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
import { post as googleAnalytics4Alerts } from './en/google-analytics-4-alerts'
import { post as ga4AuditChecklist } from './en/ga4-audit-checklist'
import { post as duplicatePurchaseEventsGa4 } from './en/duplicate-purchase-events-ga4'
import { post as botTrafficGa4 } from './en/bot-traffic-ga4'
import { post as notSetInGa4 } from './en/not-set-in-ga4'
import { post as ga4DataThresholds } from './en/ga4-data-thresholds'
import { post as ga4ReportingChecklist } from './en/ga4-reporting-checklist'
import { post as ga4EventMonitoring } from './en/ga4-event-monitoring'
import { post as ga4EventVerification } from './en/ga4-event-verification'
import { post as ga4DataDiscrepancies } from './en/ga4-data-discrepancies'
import { post as automateGa4DataQualityChecks } from './en/automate-ga4-data-quality-checks'
import { post as ga4AutomaticallyCollectedEvents } from './en/ga4-automatically-collected-events'
import { post as utmLinkBuilderGa4 } from './en/utm-link-builder-ga4'
import { post as whatIsADataLayer } from './en/what-is-a-data-layer'
import { post as googleAnalytics4Guide } from './en/google-analytics-4-guide'

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

export const BLOG_POSTS_EN: BlogPostEn[] = [
  googleAnalytics4Alerts,
  ga4AuditChecklist,
  duplicatePurchaseEventsGa4,
  botTrafficGa4,
  notSetInGa4,
  ga4DataThresholds,
  ga4ReportingChecklist,
  ga4EventMonitoring,
  ga4EventVerification,
  ga4DataDiscrepancies,
  automateGa4DataQualityChecks,
  ga4AutomaticallyCollectedEvents,
  utmLinkBuilderGa4,
  whatIsADataLayer,
  googleAnalytics4Guide,
]

export function getPublishedPostsEn(): BlogPostEn[] {
  return BLOG_POSTS_EN
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

export function getPostBySlugEn(slug: string): BlogPostEn | undefined {
  return BLOG_POSTS_EN.find(p => p.slug === slug && p.status === 'published')
}
