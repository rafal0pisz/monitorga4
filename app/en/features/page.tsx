import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import FeatureSubnav from '@/components/marketing/FeatureSubnav'
import SetHtmlLang from '@/components/marketing/SetHtmlLang'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'

const TITLE = 'Features'
const DESCRIPTION = "What AlertGA4 checks every day in your GA4 property: traffic, parameter and custom/e-commerce event verification, email alerts, a project summary, team collaboration, and a setup wizard."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/en/features',
    languages: { 'pl': '/funkcje', 'en': '/en/features' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/en/features',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
}

const SUBNAV = [
  { href: '#full-monitoring', label: 'Full property monitoring' },
  { href: '#parameters', label: 'Parameter verification' },
  { href: '#custom-events', label: 'Custom events' },
  { href: '#ecommerce', label: 'E-commerce events' },
  { href: '#email-alert', label: 'Email alerts' },
  { href: '#summary', label: 'Project summary' },
  { href: '#team', label: 'Team collaboration' },
  { href: '#wizard', label: 'Setup wizard' },
]

export default async function FeaturesPageEn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Sign up with Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Log in' }

  return (
    <div className="lp">
      <SetHtmlLang lang="en" />
      <style>{`
        ${LANDING_BASE_STYLES}

        .fx-hero { padding: 56px 0 36px; text-align: center; }
        .fx-hero .eyebrow { font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8b939a; margin-bottom: 14px; }
        .fx-hero h1 { font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.01em; max-width: 680px; margin: 0 auto 14px; }
        .fx-hero p { font-size: 15.5px; color: #5b6570; max-width: 540px; margin: 0 auto; line-height: 1.6; }

        .fx-subnav { position: sticky; top: 68px; z-index: 20; background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); border-bottom: 1px solid #e2e6e8; }
        .fx-subnav-wrap { position: relative; }
        .fx-subnav-row { display: flex; gap: 6px; overflow-x: auto; padding: 12px 24px; scrollbar-width: none; }
        .fx-subnav-row::-webkit-scrollbar { display: none; }
        .fx-subnav a { flex-shrink: 0; font-size: 13px; font-weight: 500; color: #5b6570; text-decoration: none; padding: 7px 14px; border-radius: 999px; border: 1px solid #e2e6e8; white-space: nowrap; }
        .fx-subnav a:hover { border-color: #232b31; color: #232b31; }

        .fx-subnav-wrap::before, .fx-subnav-wrap::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 40px; pointer-events: none;
          opacity: 0; transition: opacity 0.2s; z-index: 1;
        }
        .fx-subnav-wrap::before { left: 0; background: linear-gradient(90deg, #fdfdfd, rgba(253,253,253,0)); }
        .fx-subnav-wrap::after { right: 0; background: linear-gradient(270deg, #fdfdfd, rgba(253,253,253,0)); }
        .fx-subnav-wrap.can-left::before { opacity: 1; }
        .fx-subnav-wrap.can-right::after { opacity: 1; }

        .fx-subnav-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
          width: 26px; height: 26px; border-radius: 50%; border: 1px solid #e2e6e8;
          background: #fff; color: #5b6570; font-size: 14px; line-height: 1;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 1px 4px rgba(35,43,49,0.14); padding: 0;
        }
        .fx-subnav-arrow:hover { border-color: #232b31; color: #232b31; }
        .fx-subnav-arrow--left { left: 6px; }
        .fx-subnav-arrow--right { right: 6px; }

        .fx-feature { padding: 76px 0; border-bottom: 1px solid #e2e6e8; }
        .fx-feature:nth-child(even) { background: #f3f6f7; }
        .fx-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; }
        .fx-feature-grid.flip .fx-feature-text { order: 2; }
        .fx-feature-grid.flip .fx-feature-visual { order: 1; }
        @media (max-width: 880px) {
          .fx-feature-grid { grid-template-columns: 1fr; gap: 30px; }
          .fx-feature-grid.flip .fx-feature-text, .fx-feature-grid.flip .fx-feature-visual { order: initial; }
        }
        .fx-feature-num { font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 600; color: #8b939a; margin-bottom: 12px; }
        .fx-feature-text h2 { font-size: clamp(20px, 2.4vw, 25px); margin-bottom: 12px; }
        .fx-feature-text p { font-size: 14.5px; color: #5b6570; line-height: 1.65; margin: 0 0 18px; max-width: 46ch; }
        .fx-feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 9px; }
        .fx-feature-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: #232b31; }
        .fx-feature-list li::before { content: '✓'; color: #16a34a; font-weight: 700; flex-shrink: 0; }

        .core-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); }
        .core-chip { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 9px 11px; border-radius: 8px; background: #f3f6f7; border: 1px solid #e2e6e8; }
        .core-chip .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .cov-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); }
        .cov-row + .cov-row { margin-top: 16px; }
        .cov-label { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 12px; color: #8b939a; margin-bottom: 6px; }
        .cov-label b { color: #232b31; }
        .cov-track { height: 6px; border-radius: 3px; background: #e2e6e8; }
        .cov-fill { height: 100%; border-radius: 3px; background: #16a34a; }
        .cov-fill.warn { background: #ea580c; }

        .evt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .evt-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .evt-name { font-family: var(--font-mono), monospace; font-size: 12.5px; font-weight: 600; }
        .evt-num { font-family: var(--font-mono), monospace; font-size: 19px; font-weight: 700; margin-top: 6px; }
        .evt-delta { font-family: var(--font-mono), monospace; font-size: 11px; margin-top: 2px; }
        .evt-delta.up { color: #166534; }
        .evt-delta.down { color: #c23b34; }

        .email-frame { border-radius: 14px; border: 1px solid #e2e6e8; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); overflow: hidden; background: #fff; }
        .email-body { padding: 18px 20px; }
        .email-score-row { display: flex; align-items: flex-end; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #e2e6e8; margin-bottom: 12px; }
        .email-score { font-family: var(--font-mono), monospace; font-size: 36px; font-weight: 700; color: #c23b34; line-height: 1; }
        .email-score-tag { display: inline-block; font-size: 10px; font-weight: 700; color: #232b31; background: #fffd73; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; }
        .email-issue { display: flex; gap: 8px; padding: 8px 10px; border-radius: 7px; background: #fdf2f1; margin-bottom: 6px; font-size: 11.5px; }
        .email-issue .tag { font-family: var(--font-mono), monospace; font-size: 9px; font-weight: 700; color: #c23b34; flex-shrink: 0; padding-top: 1px; }

        .proj-table { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); }
        .proj-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid #e2e6e8; }
        .proj-row:last-child { border-bottom: none; }
        .proj-name { font-weight: 600; font-size: 13px; }
        .proj-domain { font-family: var(--font-mono), monospace; font-size: 10.5px; color: #8b939a; }
        .proj-badge { font-family: var(--font-mono), monospace; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; }

        .wiz-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 24px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); }
        .wiz-steps { display: flex; align-items: center; margin-bottom: 20px; }
        .wiz-dot { width: 22px; height: 22px; border-radius: 50%; background: #16a34a; color: #fff; font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wiz-dot.todo { background: #f3f6f7; color: #8b939a; border: 1px solid #e2e6e8; }
        .wiz-line { flex: 1; height: 1px; background: #e2e6e8; margin: 0 6px; }
        .wiz-line.done { background: #16a34a; opacity: 0.4; }
        .wiz-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; border: 1px solid #16a34a; background: #f0fdf4; margin-bottom: 6px; font-size: 12.5px; }
        .wiz-row.off { border-color: #e2e6e8; background: #fff; opacity: 0.6; }
        .wiz-tag { font-size: 9.5px; padding: 1px 6px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 500; }
        .wiz-vol { margin-left: auto; font-family: var(--font-mono), monospace; font-size: 11px; color: #8b939a; }

        .team-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 10px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -22px rgba(35,43,49,0.2); }
        .team-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 10px; }
        .team-row + .team-row { margin-top: 2px; }
        .team-member { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .team-avatar { width: 30px; height: 30px; border-radius: 50%; background: #f3f6f7; border: 1px solid #e2e6e8; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 700; color: #232b31; flex-shrink: 0; }
        .team-name { font-size: 12.5px; font-weight: 600; color: #232b31; }
        .team-role { font-size: 11px; color: #8b939a; margin-top: 1px; }
        .team-badge { font-size: 10.5px; font-weight: 600; color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .team-badge.pending { color: #9a3412; background: #fff7ed; border-color: #fdba74; }

      `}</style>

      <LandingNav primaryCta={primaryCta} user={!!user} lang="en" routeKey="features" />

      <main>
        <section className="fx-hero">
          <div className="wrap wrap--narrow">
            <div className="eyebrow">AlertGA4 features</div>
            <h1>Everything AlertGA4 checks in your GA4 property, every day</h1>
            <p>From traffic monitoring to an email alert, before broken data reaches your report.</p>
          </div>
        </section>

        <div className="fx-subnav">
          <div className="wrap">
            <FeatureSubnav items={SUBNAV} lang="en" />
          </div>
        </div>

        <section className="fx-feature" id="full-monitoring">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">01</div>
                <h2>Full property monitoring</h2>
                <p>We compare traffic, engagement and conversions week over week every day, to catch an anomaly before you'd spot it in a monthly report.</p>
                <ul className="fx-feature-list">
                  <li>Self-referral and direct-traffic spikes after a domain migration</li>
                  <li>Bounce-rate and conversion anomalies, week over week</li>
                  <li>Suspicious bot activity in the middle of the night</li>
                  <li>Unusual traffic growth or drops from a given country</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="core-grid">
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Bank Payment Referral</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Engagement rate</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#ea580c' }} />Direct traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Conversion rate</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />SEM traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#dc2626' }} />Bot traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />(not set) traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Geo anomaly</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="parameters">
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">02</div>
                <h2>Parameter verification</h2>
                <p>An event can fire and still not carry the key data. We check whether the parameters you defined actually arrive with the event, and in what share of cases.</p>
                <ul className="fx-feature-list">
                  <li>Parameter coverage calculated week over week</li>
                  <li>Coverage of a parameter sent with a specific event</li>
                  <li>Warning when a parameter isn't registered as a custom dimension</li>
                  <li>Works for both standard and custom parameters</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="cov-card">
                  <div className="cov-row">
                    <div className="cov-label"><span>transaction_id</span><b>100%</b></div>
                    <div className="cov-track"><div className="cov-fill" style={{ width: '100%' }} /></div>
                  </div>
                  <div className="cov-row">
                    <div className="cov-label"><span>currency</span><b>98%</b></div>
                    <div className="cov-track"><div className="cov-fill" style={{ width: '98%' }} /></div>
                  </div>
                  <div className="cov-row">
                    <div className="cov-label"><span>item_category</span><b>87%</b></div>
                    <div className="cov-track"><div className="cov-fill" style={{ width: '87%' }} /></div>
                  </div>
                  <div className="cov-row">
                    <div className="cov-label"><span>value</span><b>12%</b></div>
                    <div className="cov-track"><div className="cov-fill warn" style={{ width: '12%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="custom-events">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">03</div>
                <h2>Custom event monitoring</h2>
                <p>Form submits, logins, articles read to the end. You define which custom events to watch, and AlertGA4 checks their presence and volume every day.</p>
                <ul className="fx-feature-list">
                  <li>Alert when an event goes silent from one day to the next</li>
                  <li>Detects volume drops week over week</li>
                  <li>Event suggestions based on what's actually visible in GA4</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="evt-grid">
                  <div className="evt-card"><div className="evt-name">form_send</div><div className="evt-num">3,420</div><div className="evt-delta up">▲ 14.8%</div></div>
                  <div className="evt-card"><div className="evt-name">login</div><div className="evt-num">7,772</div><div className="evt-delta down">▼ 42.0%</div></div>
                  <div className="evt-card"><div className="evt-name">sign_up</div><div className="evt-num">890</div><div className="evt-delta up">▲ 17.1%</div></div>
                  <div className="evt-card"><div className="evt-name">article_read</div><div className="evt-num">45,320</div><div className="evt-delta up">▲ 7.6%</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="ecommerce">
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">04</div>
                <h2>E-commerce event monitoring</h2>
                <p>We watch the continuity of the whole funnel, from the first product view to purchase, and volume drops at every step separately.</p>
                <ul className="fx-feature-list">
                  <li>All 14 standard GA4 e-commerce events under one switch</li>
                  <li>Detects a duplicated purchase event</li>
                  <li>Alert when an event disappears for part of the catalog</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="evt-grid">
                  <div className="evt-card"><div className="evt-name">view_item</div><div className="evt-num">8,200</div><div className="evt-delta up">▲ 3.8%</div></div>
                  <div className="evt-card"><div className="evt-name">add_to_cart</div><div className="evt-num">3,204</div><div className="evt-delta up">▲ 5.2%</div></div>
                  <div className="evt-card"><div className="evt-name">begin_checkout</div><div className="evt-num">1,118</div><div className="evt-delta down">▼ 9.4%</div></div>
                  <div className="evt-card"><div className="evt-name">purchase</div><div className="evt-num">842</div><div className="evt-delta up">▲ 1.1%</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="email-alert">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">05</div>
                <h2>Email alerts</h2>
                <p>You get a daily email with a result and a concrete diagnosis, not just a number — whether or not anything actually broke that day. Prefer it quieter? Turn on the option to only get an alert when we detect a real problem.</p>
                <ul className="fx-feature-list">
                  <li>Per-project alerts, to an address you configure yourself</li>
                  <li>Optional: only when a warning or error appears, not every day</li>
                  <li>A combined summary of every project for the account owner</li>
                  <li>A separate notification when the Google connection expires</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="email-frame">
                  <div className="email-body">
                    <div className="email-score-row">
                      <span className="email-score">68</span>
                      <div><div className="email-score-tag">Below threshold</div><div style={{ fontSize: 11, color: '#5b6570' }}>hotel-lakeside.com</div></div>
                    </div>
                    <div className="email-issue"><span className="tag">FAIL</span><div>No <span className="mono-inline">add_to_cart</span> events in the last 24h</div></div>
                    <div className="email-issue"><span className="tag">FAIL</span><div>3.2% of sessions are self-referral</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="summary">
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">06</div>
                <h2>A summary of every project</h2>
                <p>One view of every monitored GA4 property with its current score and trend, instead of clicking into each one separately.</p>
                <ul className="fx-feature-list">
                  <li>Sorted by worst score first</li>
                  <li>Week-over-week trend next to every project</li>
                  <li>Especially useful when managing several clients at once</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="proj-table">
                  <div className="proj-row">
                    <div><div className="proj-name">bike-shop.com</div><div className="proj-domain">properties/312894701</div></div>
                    <div className="mono-inline" style={{ color: '#166534' }}>▲ 3</div>
                    <div className="proj-badge" style={{ background: '#f0fdf4', color: '#166534' }}>94</div>
                  </div>
                  <div className="proj-row">
                    <div><div className="proj-name">law-firm-smith.com</div><div className="proj-domain">properties/298117440</div></div>
                    <div className="mono-inline" style={{ color: '#166534' }}>▲ 1</div>
                    <div className="proj-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>87</div>
                  </div>
                  <div className="proj-row">
                    <div><div className="proj-name">hotel-lakeside.com</div><div className="proj-domain">properties/305562019</div></div>
                    <div className="mono-inline" style={{ color: '#c23b34' }}>▼ 14</div>
                    <div className="proj-badge" style={{ background: '#fff7ed', color: '#ea580c' }}>68</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="team">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">07</div>
                <h2>Team collaboration (Agency)</h2>
                <p>Invite your team to work on the account together — without sharing passwords or creating a separate Google account per person.</p>
                <ul className="fx-feature-list">
                  <li>Up to 5 people on the Agency plan</li>
                  <li>Invite by email, accepted with their own Google sign-in</li>
                  <li>GA4 data only becomes visible once that person has real, verified access to the property in Google — the AlertGA4 invite alone isn't enough</li>
                  <li>Your own projects and membership in someone else's team work independently of each other</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="team-card">
                  <div className="team-row">
                    <div className="team-member">
                      <span className="team-avatar">RP</span>
                      <div><div className="team-name">rafal@agency.com</div><div className="team-role">Account owner</div></div>
                    </div>
                    <span className="team-badge">Plan: Agency</span>
                  </div>
                  <div className="team-row">
                    <div className="team-member">
                      <span className="team-avatar">AK</span>
                      <div><div className="team-name">anna@agency.com</div><div className="team-role">Team member</div></div>
                    </div>
                    <span className="team-badge">Access: 4 / 5 properties</span>
                  </div>
                  <div className="team-row">
                    <div className="team-member">
                      <span className="team-avatar">MW</span>
                      <div><div className="team-name">mark@agency.com</div><div className="team-role">Invited</div></div>
                    </div>
                    <span className="team-badge pending">Awaiting acceptance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="wizard" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">08</div>
                <h2>Setup wizard with suggestions from GA4</h2>
                <p>Instead of typing event names blind, the wizard reads real data from the connected GA4 property and suggests what's worth monitoring, along with its volume.</p>
                <ul className="fx-feature-list">
                  <li>Event and parameter suggestions based on the last 30 days</li>
                  <li>The same thing, added one at a time later on, without redoing the whole wizard</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="wiz-card">
                  <div className="wiz-steps">
                    <div className="wiz-dot">✓</div><div className="wiz-line done" />
                    <div className="wiz-dot">✓</div><div className="wiz-line done" />
                    <div className="wiz-dot">3</div><div className="wiz-line" />
                    <div className="wiz-dot todo">4</div><div className="wiz-line" />
                    <div className="wiz-dot todo">5</div>
                  </div>
                  <div className="wiz-row"><span className="mono-inline" style={{ fontWeight: 600 }}>purchase</span><span className="wiz-tag">standard</span><span className="wiz-vol">1,842 / 30 days</span></div>
                  <div className="wiz-row"><span className="mono-inline" style={{ fontWeight: 600 }}>sign_up</span><span className="wiz-tag">standard</span><span className="wiz-vol">412 / 30 days</span></div>
                  <div className="wiz-row off"><span className="mono-inline" style={{ fontWeight: 600 }}>scroll</span><span className="wiz-tag">standard</span><span className="wiz-vol">28,410 / 30 days</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} lang="en" />
      </main>

      <LandingFooter lang="en" />
    </div>
  )
}
