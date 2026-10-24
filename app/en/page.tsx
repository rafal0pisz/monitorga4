import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import TrustStrip from '@/components/marketing/TrustStrip'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { TRIAL_DAYS } from '@/lib/billing/plans'

const TITLE = 'AlertGA4 — Google Analytics 4 data quality monitoring'
const DESCRIPTION = 'AlertGA4 checks your Google Analytics 4 property every day — events, parameters, e-commerce funnel and traffic anomalies — and emails you an alert before broken data reaches your reports.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/en',
    languages: { 'pl': '/', 'en': '/en', 'x-default': '/en' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/en',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

const STEPS = [
  { t: 'Sign in with Google', d: "You authorize with an email that has access to the property. We never change any settings on your account, and our app is a Google-verified provider." },
  { t: 'Add a GA4 property', d: 'Pick any property you already have access to. AlertGA4 runs its first set of checks immediately.' },
  { t: 'Configure what to track', d: "Choose which events, parameters and thresholds to monitor. Checks are fitted to your implementation, not the other way around." },
  { t: 'Get a daily email summary', d: "A daily data-quality result with a summary and a description of every category that needs attention." },
]

const EVENT_EXAMPLES = [
  { name: 'form_send', current: 3420, prev: 2980, delta: 14.8, days: [{ c: 9, p: 7 }, { c: 11, p: 9 }, { c: 8, p: 6 }, { c: 12, p: 10 }, { c: 10, p: 8 }] },
  { name: 'login', current: 7772, prev: 13400, delta: -42.0, days: [{ c: 15, p: 16 }, { c: 13, p: 15 }, { c: 17, p: 18 }, { c: 12, p: 13 }, { c: 6, p: 15 }] },
  { name: 'sign_up', current: 890, prev: 760, delta: 17.1, days: [{ c: 10, p: 8 }, { c: 12, p: 9 }, { c: 9, p: 7 }, { c: 13, p: 10 }, { c: 11, p: 9 }] },
  { name: 'article_read', current: 45320, prev: 42100, delta: 7.6, days: [{ c: 15, p: 14 }, { c: 17, p: 15 }, { c: 14, p: 13 }, { c: 18, p: 16 }, { c: 16, p: 15 }] },
]

const ECOMMERCE_EXAMPLES = [
  { name: 'view_item', current: 8200, prev: 7900, delta: 3.8, days: [{ c: 16, p: 15 }, { c: 14, p: 13 }, { c: 18, p: 17 }, { c: 15, p: 14 }, { c: 17, p: 16 }] },
  { name: 'add_to_cart', current: 12, prev: 1450, delta: -99.2, days: [{ c: 13, p: 14 }, { c: 15, p: 16 }, { c: 12, p: 13 }, { c: 14, p: 15 }, { c: 1, p: 14 }] },
  { name: 'view_cart', current: 615, prev: 598, delta: 2.8, days: [{ c: 12, p: 11 }, { c: 10, p: 9 }, { c: 13, p: 12 }, { c: 11, p: 10 }, { c: 12, p: 11 }] },
  { name: 'purchase', current: 214, prev: 198, delta: 8.1, days: [{ c: 9, p: 8 }, { c: 8, p: 7 }, { c: 10, p: 9 }, { c: 9, p: 8 }, { c: 10, p: 9 }] },
]

type EventExample = (typeof EVENT_EXAMPLES)[number]

function EventMiniCard({ ev }: { ev: EventExample }) {
  const statusColor = ev.delta >= 0 ? '#16a34a' : '#dc2626'
  return (
    <div style={{ padding: '7px 8px', borderRadius: 7, background: '#fff', border: '0.5px solid #e2e6e8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{ev.current.toLocaleString('en')}</span>
      </div>
      <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 20, marginBottom: 4 }}>
        {ev.days.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1, height: d.p, background: '#e2e6e8', borderRadius: '1px 1px 0 0', minWidth: 2 }} />
            <div style={{ flex: 1, height: d.c, background: '#16a34a', borderRadius: '1px 1px 0 0', minWidth: 2 }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: statusColor }}>
        {ev.delta >= 0 ? '▲' : '▼'} {Math.abs(ev.delta).toFixed(1)}%
      </div>
    </div>
  )
}

const INCIDENTS = [
  {
    tag: 'duplicates',
    title: 'Duplicated purchase event',
    desc: <>A new deployment script starts sending <code className="mono-inline">purchase</code> twice. Reported revenue climbs 40%, and nobody notices for three weeks.</>,
  },
  {
    tag: 'self-referral',
    title: 'Your own domain as a traffic source',
    desc: 'A newsletter link loses its UTM parameters after a site migration. The client\'s own domain suddenly becomes its own top traffic source.',
  },
  {
    tag: 'missing event',
    title: 'A silent drop in events',
    desc: 'A site change can cause partial gaps in some events. The app verifies and catches individual events and differences in conversions.',
  },
  {
    tag: 'bot traffic',
    title: 'An anomaly in the middle of the night',
    desc: "A client's security scanner generates thousands of sessions at 3am. The conversion rate in the monthly report drops by half for no apparent reason.",
  },
]

const DASHBOARD_ROWS = [
  { name: 'bike-shop.com', prop: 'properties/312894701', trend: '▲ 3', up: true, score: 94, bg: '#f0fdf4', fg: '#166534' },
  { name: 'law-firm-smith.com', prop: 'properties/298117440', trend: '▲ 1', up: true, score: 87, bg: '#f0fdf4', fg: '#16a34a' },
  { name: 'hotel-lakeside.com', prop: 'properties/305562019', trend: '▼ 14', up: false, score: 68, bg: '#fff7ed', fg: '#ea580c' },
  { name: 'fitness-club-berlin.com', prop: 'properties/311098823', trend: '▼ 26', up: false, score: 41, bg: '#fef2f2', fg: '#dc2626' },
]

const AUDIENCE = [
  { t: 'GA4 property owners', d: "You manage your own GA4 property and want to know right away when something stops working, instead of waiting until month-end to spot a drop in a report." },
  { t: 'Marketing agencies', d: 'A summary of every property in one email, plus dedicated per-property summaries you can forward to your own clients.' },
  { t: 'Freelancers', d: "You handle several clients at once and don't have time to manually check every GA4 property. AlertGA4 does that for you, every day." },
]

const FAQ_ITEMS = [
  { q: 'Can AlertGA4 change anything in my GA4 property?', a: 'No. Access is read-only. AlertGA4 never modifies configuration, events or source data.' },
  { q: 'How long does setup take?', a: "You sign in with Google, pick a GA4 property you have access to, and immediately see your first set of checks. No changes to your site's code or to GTM." },
  { q: "Does this work for sites without online sales?", a: 'Yes. Beyond the e-commerce funnel we also check lead events, traffic, self-referral and bot anomalies, regardless of whether the property sells anything directly.' },
  { q: 'What happens if I lose access to the Google account?', a: "If automatic checks are enabled and the Google connection expires or is revoked, you'll get an email asking you to sign in again, before you'd otherwise notice something stopped working." },
]

const TREND_POINTS = '8,49.8 49.9,42.5 91.7,55.5 133.5,68.5 175.4,78.3 217.2,94.5 259.1,104.3 300.9,110.8 342.8,97.8 384.6,78.3 426.5,62 468.3,45.8 510.2,36 552,29.5'
const TREND_AREA = `${TREND_POINTS} 552,140 8,140`

export default async function HomePageEn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Sign up with Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Log in' }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AlertGA4',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://alertga4.pl/en',
    inLanguage: 'en',
    description: DESCRIPTION,
    provider: {
      '@type': 'Organization',
      name: 'Bettersteps Sp. z o.o.',
      url: 'https://www.bettersteps.pl',
      email: 'kontakt@bettersteps.pl',
    },
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

        .lp-hero { padding: 60px 0 52px; }
        .lp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
        @media (max-width: 940px) { .lp-hero-grid { grid-template-columns: 1fr; gap: 40px; } }
        .lp-hero h1 { font-size: clamp(28px, 4vw, 42px); line-height: 1.16; letter-spacing: -0.015em; margin: 0 0 20px; }
        .lp-hero .lede { font-size: 17px; color: #5b6570; line-height: 1.6; max-width: 46ch; margin-bottom: 28px; }
        .lp .trust-line { font-size: 12.5px; color: #8b939a; }

        .readout { background: #fff; border: 1px solid #e2e6e8; border-radius: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 12px 32px -16px rgba(35,43,49,0.18); overflow: hidden; }
        .readout-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e6e8; }
        .readout-prop { display: flex; align-items: center; gap: 10px; }
        .readout-prop-name { font-family: var(--font-mono), monospace; font-size: 13.5px; font-weight: 600; }
        .readout-body { padding: 26px 20px 22px; display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; }
        .score-num { font-family: var(--font-mono), monospace; font-weight: 600; font-size: clamp(42px, 11vw, 56px); line-height: 0.9; color: #166534; }
        .score-of { font-family: var(--font-mono), monospace; font-size: 18px; color: #8b939a; padding-bottom: 8px; }
        .score-bar { flex: 1; min-width: 140px; padding-bottom: 12px; }
        .score-track { height: 6px; border-radius: 4px; background: #eaeef0; overflow: hidden; margin-bottom: 8px; }
        .score-fill { height: 100%; width: 94%; background: linear-gradient(90deg, #16a34a, #166534); border-radius: 4px; }
        .score-caption { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; }
        .readout-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px 20px; }
        .chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 999px; background: #f3f6f7; border: 1px solid #e2e6e8; }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chip-dot--ok { background: #16a34a; }
        .chip-dot--warn { background: #ea580c; }
        .readout-foot { padding: 12px 20px; border-top: 1px solid #e2e6e8; background: #f3f6f7; font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; display: flex; justify-content: space-between; }

        @media (max-width: 640px) { .lp-hero { padding: 40px 0 36px; } }

        .lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 980px) { .lp-steps { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .lp-steps { grid-template-columns: 1fr; } }
        .lp-step-num { font-family: var(--font-mono), monospace; font-weight: 600; font-size: 13px; color: #fff; background: #232b31; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; flex-shrink: 0; }
        .lp-step h3 { font-size: 15.5px; margin-bottom: 8px; }
        .lp-step p { font-size: 13.5px; color: #5b6570; line-height: 1.6; }
        @media (max-width: 560px) {
          .lp-step-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
          .lp-step-num { margin-bottom: 0; }
          .lp-step h3 { margin-bottom: 0; }
        }

        .lp-log { display: flex; flex-direction: column; border-top: 1px solid #e2e6e8; }
        .lp-log-row { display: grid; grid-template-columns: 120px 1fr; gap: 24px; padding: 22px 0; border-bottom: 1px solid #e2e6e8; }
        @media (max-width: 700px) { .lp-log-row { grid-template-columns: 1fr; gap: 6px; } }
        .lp-log-tag { font-family: var(--font-mono), monospace; font-size: 12px; color: #c23b34; display: flex; align-items: flex-start; gap: 8px; padding-top: 2px; }
        .lp-log-tag .dot { width: 7px; height: 7px; border-radius: 50%; background: #ff8282; margin-top: 5px; flex-shrink: 0; }
        .lp-log-title { font-weight: 700; font-size: 15.5px; margin-bottom: 5px; }
        .lp-log-desc { font-size: 14px; color: #5b6570; line-height: 1.6; max-width: 60ch; }

        .lp-feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #e2e6e8; border: 1px solid #e2e6e8; border-radius: 14px; overflow: hidden; }
        @media (max-width: 780px) { .lp-feature-grid { grid-template-columns: 1fr; } }
        .lp-feature-cell { background: #fff; padding: 24px 26px; display: flex; flex-direction: column; gap: 16px; }
        .lp-feature-cell h3 { font-size: 15.5px; }
        .lp-feature-cell .desc { font-size: 13px; color: #5b6570; line-height: 1.55; max-width: 42ch; }
        .lp-feature-visual { margin-top: auto; padding-top: 6px; }
        .mini-spark { display: flex; align-items: flex-end; gap: 3px; height: 46px; }
        .mini-spark-bar { width: 6px; border-radius: 2px 2px 0 0; background: #eaeef0; }
        .mini-spark-bar.spike { background: #ff8282; }
        .mini-coverage-label { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; margin-bottom: 6px; }
        .mini-coverage-track { height: 8px; border-radius: 4px; background: #eaeef0; overflow: hidden; }
        .mini-coverage-fill { height: 100%; background: linear-gradient(90deg, #86efac, #16a34a); border-radius: 4px; }

        .lp-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
        @media (max-width: 880px) { .lp-preview-grid { grid-template-columns: 1fr; } }
        .lp-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 12px 32px -16px rgba(35,43,49,0.18); overflow: hidden; display: flex; flex-direction: column; }
        .lp-card-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #e2e6e8; }
        .lp-card-bar-left { display: flex; align-items: center; gap: 8px; }
        .lp-card-title { font-family: var(--font-mono), monospace; font-size: 12px; color: #8b939a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-card-tag { font-family: var(--font-mono), monospace; font-size: 12px; color: #c23b34; flex-shrink: 0; }
        @media (max-width: 480px) { .lp-card-title { display: none; } }

        .lp-trend-body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
        .lp-trend-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
        .lp-trend-score { font-family: var(--font-mono), monospace; font-weight: 600; font-size: 30px; color: #166534; }
        .lp-trend-caption { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; }
        .lp-trend-chart { flex: 1; margin-top: 8px; }

        .lp-row { display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e2e6e8; }
        .lp-row:last-child { border-bottom: none; }
        .lp-row-name { font-weight: 600; font-size: 14px; }
        .lp-row-domain { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; margin-top: 2px; }
        .lp-row-trend { font-family: var(--font-mono), monospace; font-size: 12px; }
        .lp-row-trend.up { color: #166534; }
        .lp-row-trend.down { color: #dc2626; }
        .lp-badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 7px; font-family: var(--font-mono), monospace; font-weight: 600; font-size: 13px; }
        @media (max-width: 640px) { .lp-row { grid-template-columns: 1fr auto; } .lp-row-trend { display: none; } }

        .lp-audience { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        @media (max-width: 800px) { .lp-audience { grid-template-columns: 1fr; } }
        .underline-mark { background: linear-gradient(transparent 62%, #fffd73 62%); padding: 0 2px; }
        .lp-audience-card { padding: 26px 24px; border: 1px solid #e2e6e8; border-radius: 14px; background: #fff; }
        .lp-audience-card h3 { font-size: 15.5px; margin-bottom: 10px; }
        .lp-audience-card p { font-size: 13.5px; color: #5b6570; line-height: 1.65; }

        .lp-faq-list { max-width: 720px; }
        .lp-faq-item { border-bottom: 1px solid #e2e6e8; }
        .lp-faq-item summary { cursor: pointer; list-style: none; padding: 20px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .lp-faq-item summary::-webkit-details-marker { display: none; }
        .lp-faq-item summary::after { content: '+'; font-size: 20px; font-weight: 400; color: #8b939a; flex-shrink: 0; }
        .lp-faq-item[open] summary::after { content: '\\2212'; }
        .lp-faq-item p { color: #5b6570; font-size: 14.5px; line-height: 1.65; margin: 0 0 22px; max-width: 62ch; }
      `}</style>

      <LandingNav primaryCta={primaryCta} user={!!user} lang="en" routeKey="home" />

      {/* Hero */}
      <header className="lp-hero">
        <div className="wrap lp-hero-grid">
          <div>
            <h1>Daily <span className="underline-mark">data monitoring</span> for Google Analytics 4</h1>
            <p className="lede">AlertGA4 checks your Google Analytics 4 property every day — data, events, parameters and account anomalies — and emails you a summary.</p>
            <div className="lp-hero-ctas">
              <Link href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</Link>
              <a href="#how-it-works" className="btn btn--ghost">See how it works</a>
            </div>
            <p className="trust-line">simple setup · daily checks · alerts and summaries</p>
          </div>

          <div className="readout">
            <div className="readout-head">
              <div className="readout-prop">
                <span className="readout-prop-name">Your GA4 property</span>
              </div>
            </div>
            <div className="readout-body">
              <span className="score-num">94</span>
              <span className="score-of">/100</span>
              <div className="score-bar">
                <div className="score-track"><div className="score-fill" /></div>
                <div className="score-caption">+3 vs. last week</div>
              </div>
            </div>
            <div className="readout-chips">
              <span className="chip"><span className="chip-dot chip-dot--ok" />events</span>
              <span className="chip"><span className="chip-dot chip-dot--ok" />ecommerce</span>
              <span className="chip"><span className="chip-dot chip-dot--ok" />traffic</span>
              <span className="chip"><span className="chip-dot chip-dot--warn" />parameters</span>
            </div>
            <div className="readout-foot">
              <span>last check: today, 6:33am</span>
              <span>next: tomorrow, 6:30am</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* How it works */}
        <section id="how-it-works" className="section--dim">
          <div className="wrap">
            <div className="section-head">
              <h2>How it works</h2>
              <p>From signing in to your first alert: four steps, none of which require any changes on the GA4 side.</p>
            </div>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <div className="lp-step" key={s.t}>
                  <div className="lp-step-head">
                    <div className="lp-step-num">{i + 1}</div>
                    <h3>{s.t}</h3>
                  </div>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
            {!user && (
              <div className="trial-banner-guest" style={{ marginTop: 40 }}>
                <p>Try AlertGA4 free for {TRIAL_DAYS} days. No card required.</p>
                <Link href="/login" className="btn btn--primary btn--sm">Sign up with Google</Link>
              </div>
            )}
          </div>
        </section>

        <TrustStrip lang="en" />

        {/* What we check */}
        <section id="what-we-check">
          <div className="wrap">
            <div className="section-head">
              <h2>What we check every day</h2>
              <p>We verify all the key data in Google Analytics 4 every day, split into four categories.</p>
            </div>
            <div className="lp-feature-grid">
              <div className="lp-feature-cell">
                <div>
                  <h3>Events</h3>
                  <p className="desc">Detects missing events and sessions with no events at all, before you'd spot it in a report.</p>
                </div>
                <div className="lp-feature-visual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EVENT_EXAMPLES.map(ev => <EventMiniCard key={ev.name} ev={ev} />)}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h3>E-commerce funnel</h3>
                  <p className="desc">Watches event continuity from the first product view to purchase, and volume drops at every step.</p>
                </div>
                <div className="lp-feature-visual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ECOMMERCE_EXAMPLES.map(ev => <EventMiniCard key={ev.name} ev={ev} />)}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h3>Traffic and anomalies</h3>
                  <p className="desc">Self-referral, direct-traffic spikes, suspicious bot activity at night, or unusual traffic growth or drops from a given country.</p>
                </div>
                <div className="lp-feature-visual mini-spark">
                  {[8, 11, 7, 9, 6, 10, 44, 38, 9, 7, 12, 8].map((h, i) => (
                    <div key={i} className={`mini-spark-bar${h > 30 ? ' spike' : ''}`} style={{ height: h }} />
                  ))}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h3>Parameter coverage</h3>
                  <p className="desc">Verifies whether the event parameters you defined actually arrive with the event, and what share of the time.</p>
                </div>
                <div className="lp-feature-visual">
                  <div className="mini-coverage-label"><span>item_category</span><span>87%</span></div>
                  <div className="mini-coverage-track"><div className="mini-coverage-fill" style={{ width: '87%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="section--dim">
          <div className="wrap wrap--narrow">
            <div className="section-head">
              <h2>Alerts that keep your data healthy</h2>
              <p>Keep track of any concerning changes in your data and react to potential issues on your account right away.</p>
            </div>
            <div className="lp-log">
              {INCIDENTS.map(inc => (
                <div className="lp-log-row" key={inc.title}>
                  <div className="lp-log-tag"><span className="dot" />{inc.tag}</div>
                  <div>
                    <div className="lp-log-title">{inc.title}</div>
                    <div className="lp-log-desc">{inc.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preview — trend + dashboard */}
        <section>
          <div className="wrap">
            <div className="section-head">
              <h2>Score, trend and every project in one place</h2>
              <p>See not just the current score, but how it changed over time, and the status of every monitored property at once.</p>
            </div>
            <div className="lp-preview-grid">
              <div className="lp-card">
                <div className="lp-card-bar">
                  <div className="lp-card-bar-left">
                    <span className="lp-card-title">bike-shop.com · 14 days</span>
                  </div>
                </div>
                <div className="lp-trend-body">
                  <div className="lp-trend-top">
                    <span className="lp-trend-score">94</span>
                    <span className="lp-trend-caption">alert threshold: 70</span>
                  </div>
                  <div className="lp-trend-chart">
                    <svg viewBox="0 0 560 150" width="100%" height="140" preserveAspectRatio="none">
                      <line x1="8" y1="42" x2="552" y2="42" stroke="#e2e6e8" strokeWidth="1" />
                      <line x1="8" y1="90" x2="552" y2="90" stroke="#e2e6e8" strokeWidth="1" />
                      <line x1="8" y1="107.5" x2="552" y2="107.5" stroke="#c23b34" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                      <polygon points={TREND_AREA} fill="#16a34a" opacity="0.08" />
                      <polyline points={TREND_POINTS} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="552" cy="29.5" r="5" fill="#166534" />
                      <circle cx="552" cy="29.5" r="9" fill="#166534" opacity="0.18" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="lp-card">
                <div className="lp-card-bar">
                  <div className="lp-card-bar-left">
                    <span className="lp-card-title">alertga4.pl/dashboard</span>
                  </div>
                  <span className="lp-card-tag">+ new project</span>
                </div>
                {DASHBOARD_ROWS.map(r => (
                  <div className="lp-row" key={r.name}>
                    <div>
                      <div className="lp-row-name">{r.name}</div>
                      <div className="lp-row-domain">{r.prop}</div>
                    </div>
                    <span className={`lp-row-trend ${r.up ? 'up' : 'down'}`}>{r.trend}</span>
                    <span className="lp-badge" style={{ background: r.bg, color: r.fg }}>{r.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section id="who-its-for">
          <div className="wrap">
            <div className="section-head">
              <h2>Who it&rsquo;s for</h2>
            </div>
            <div className="lp-audience">
              {AUDIENCE.map(a => (
                <div className="lp-audience-card" key={a.t}>
                  <h3>{a.t}</h3>
                  <p>{a.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section--dim">
          <div className="wrap wrap--narrow">
            <div className="section-head">
              <h2>Frequently asked questions</h2>
            </div>
            <div className="lp-faq-list">
              {FAQ_ITEMS.map(f => (
                <details className="lp-faq-item" key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} lang="en" />
      </main>

      <LandingFooter lang="en" />
    </div>
  )
}
