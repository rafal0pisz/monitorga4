import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BrandWordmark from '@/components/ui/BrandWordmark'

const STEPS = [
  { t: 'Logujesz się kontem Google', d: 'Autoryzujesz AlertGA4 z dostępem wyłącznie do odczytu — jak rola „Viewer" w GA4.' },
  { t: 'Dodajesz usługę GA4', d: 'Wybierasz dowolną usługę, do której masz już dostęp. AlertGA4 od razu uruchamia pierwszy zestaw sprawdzeń.' },
  { t: 'Konfiguracja zmiennych', d: 'Dobierasz, które eventy, parametry i progi mają być monitorowane — dopasowujesz sprawdzenia do swojego wdrożenia, nie odwrotnie.' },
  { t: 'Podsumowanie na maila', d: 'Wynik spada poniżej progu? Aplikacja poinformuje Cię mailowo z opisem kategorii, która wymaga weryfikacji.' },
]

const EVENT_EXAMPLES = [
  { name: 'form_send', current: 3420, prev: 2980, delta: 14.8, days: [{ c: 9, p: 7 }, { c: 11, p: 9 }, { c: 8, p: 6 }, { c: 12, p: 10 }, { c: 10, p: 8 }] },
  { name: 'login', current: 12050, prev: 13400, delta: -10.1, days: [{ c: 14, p: 16 }, { c: 12, p: 15 }, { c: 16, p: 18 }, { c: 11, p: 13 }, { c: 13, p: 15 }] },
  { name: 'sign_up', current: 890, prev: 760, delta: 17.1, days: [{ c: 10, p: 8 }, { c: 12, p: 9 }, { c: 9, p: 7 }, { c: 13, p: 10 }, { c: 11, p: 9 }] },
  { name: 'article_read', current: 45320, prev: 42100, delta: 7.6, days: [{ c: 15, p: 14 }, { c: 17, p: 15 }, { c: 14, p: 13 }, { c: 18, p: 16 }, { c: 16, p: 15 }] },
]

const ECOMMERCE_EXAMPLES = [
  { name: 'view_item', current: 8200, prev: 7900, delta: 3.8, days: [{ c: 16, p: 15 }, { c: 14, p: 13 }, { c: 18, p: 17 }, { c: 15, p: 14 }, { c: 17, p: 16 }] },
  { name: 'add_to_cart', current: 12, prev: 1450, delta: -99.2, days: [{ c: 1, p: 14 }, { c: 1, p: 16 }, { c: 2, p: 13 }, { c: 1, p: 15 }, { c: 1, p: 14 }] },
  { name: 'view_cart', current: 615, prev: 598, delta: 2.8, days: [{ c: 12, p: 11 }, { c: 10, p: 9 }, { c: 13, p: 12 }, { c: 11, p: 10 }, { c: 12, p: 11 }] },
  { name: 'purchase', current: 214, prev: 198, delta: 8.1, days: [{ c: 9, p: 8 }, { c: 8, p: 7 }, { c: 10, p: 9 }, { c: 9, p: 8 }, { c: 10, p: 9 }] },
]

type EventExample = (typeof EVENT_EXAMPLES)[number]

function EventMiniCard({ ev }: { ev: EventExample }) {
  const color = ev.delta >= 0 ? '#16a34a' : '#dc2626'
  return (
    <div style={{ padding: '7px 8px', borderRadius: 7, background: '#fff', border: '0.5px solid #e2e6e8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{ev.current.toLocaleString('en')}</span>
      </div>
      <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 20, marginBottom: 4 }}>
        {ev.days.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1, height: d.p, background: '#e2e6e8', borderRadius: '1px 1px 0 0', minWidth: 2 }} />
            <div style={{ flex: 1, height: d.c, background: color, borderRadius: '1px 1px 0 0', minWidth: 2 }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color }}>
        {ev.delta >= 0 ? '▲' : '▼'} {Math.abs(ev.delta).toFixed(1)}%
      </div>
    </div>
  )
}

const INCIDENTS = [
  {
    tag: 'duplikaty',
    title: 'Zdublowany event purchase',
    desc: <>Nowy skrypt wdrożenia zaczyna wysyłać <code className="mono-inline">purchase</code> dwukrotnie. Przychód w raportach rośnie o 40% — i nikt tego nie zauważa przez trzy tygodnie.</>,
  },
  {
    tag: 'self-referral',
    title: 'Własna domena jako źródło ruchu',
    desc: 'Link z newslettera traci parametry UTM po migracji strony. Domena klienta staje się nagle jego własnym głównym źródłem ruchu.',
  },
  {
    tag: 'brakujący event',
    title: 'Cichy spadek zdarzeń',
    desc: <>Redesign jednej podstrony usuwa tag menedżera zdarzeń. <code className="mono-inline">add_to_cart</code> znika z 30% katalogu — lejek wciąż „działa", tylko gorzej.</>,
  },
  {
    tag: 'ruch botów',
    title: 'Anomalia w środku nocy',
    desc: 'Skaner bezpieczeństwa klienta generuje tysiące sesji o 3:00. Współczynnik konwersji w miesięcznym raporcie spada o połowę bez wyraźnego powodu.',
  },
]

const DASHBOARD_ROWS = [
  { name: 'sklep-rowerowy.pl', prop: 'properties/312894701', trend: '▲ 3', up: true, score: 94, bg: '#f0fdf4', fg: '#166534' },
  { name: 'kancelaria-nowak.pl', prop: 'properties/298117440', trend: '▲ 1', up: true, score: 87, bg: '#f0fdf4', fg: '#16a34a' },
  { name: 'hotel-mazury.pl', prop: 'properties/305562019', trend: '▼ 14', up: false, score: 68, bg: '#fff7ed', fg: '#ea580c' },
  { name: 'fitness-club-warszawa.pl', prop: 'properties/311098823', trend: '▼ 26', up: false, score: 41, bg: '#fef2f2', fg: '#dc2626' },
]

const AUDIENCE = [
  { t: 'Właściciele usług GA4', d: 'Samodzielnie zarządzasz swoją usługą GA4 i chcesz wiedzieć od razu, gdy coś przestanie działać — bez czekania do końca miesiąca na spadek w raporcie.' },
  { t: 'Agencje marketingowe', d: 'Jeden widok z wynikiem jakości dla wszystkich usług GA4 klientów, zamiast ręcznego przeglądania każdej z osobna raz na kwartał.' },
  { t: 'Freelancerzy', d: 'Obsługujesz kilku klientów naraz i nie masz czasu ręcznie sprawdzać każdej usługi GA4 — AlertGA4 robi to za Ciebie każdego dnia.' },
]

const TREND_POINTS = '8,49.8 49.9,42.5 91.7,55.5 133.5,68.5 175.4,78.3 217.2,94.5 259.1,104.3 300.9,110.8 342.8,97.8 384.6,78.3 426.5,62 468.3,45.8 510.2,36 552,29.5'
const TREND_AREA = `${TREND_POINTS} 552,140 8,140`

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryCta = user
    ? { href: '/dashboard', label: 'Przejdź do panelu' }
    : { href: '/login', label: 'Zarejestruj się przez Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Zaloguj się' }

  return (
    <div className="lp">
      <style>{`
        .lp { background: #ffffff; color: #232b31; }
        .lp * { box-sizing: border-box; }
        .lp .wrap { max-width: 1120px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
        .lp .wrap--narrow { max-width: 760px; }
        .lp h1, .lp h2, .lp h3, .lp h4 { font-family: var(--font-sans), sans-serif; font-weight: 700; text-wrap: balance; margin: 0; }
        .lp p { margin: 0; }
        .lp a { color: inherit; }
        .mono-inline { font-family: var(--font-mono), monospace; font-size: 0.94em; }

        .lp .eyebrow {
          font-family: var(--font-mono), monospace; font-weight: 500; font-size: 12px;
          letter-spacing: 0.09em; text-transform: uppercase; color: #c23b34;
          display: flex; align-items: center; gap: 8px;
        }
        .lp .eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #ff8282; flex-shrink: 0; }

        .lp-nav { position: sticky; top: 0; z-index: 40; background: rgba(35,43,49,0.96); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .lp-nav-row { display: flex; align-items: center; justify-content: space-between; height: 68px; gap: 12px; }
        .lp-nav-links { display: flex; align-items: center; gap: 30px; }
        .lp-nav-links a { font-size: 14px; font-weight: 500; text-decoration: none; color: rgba(255,255,255,0.68); }
        .lp-nav-links a:hover { color: #fff; }
        .lp-nav-cta { display: flex; align-items: center; gap: 18px; }
        .lp-nav-cta .login-link { font-size: 14px; font-weight: 600; text-decoration: none; color: #fff; white-space: nowrap; }
        .lp-nav-cta .btn--primary { background: #fffd73; color: #3a3800; }
        .lp-nav-cta .btn--primary:hover { box-shadow: 0 6px 20px -6px rgba(255,253,115,0.5); }
        .lp-nav .nav-cta-full { display: inline; }
        .lp-nav .nav-cta-short { display: none; }
        @media (max-width: 860px) { .lp-nav-links { display: none; } }
        @media (max-width: 480px) {
          .lp-nav-cta .login-link { display: none; }
          .lp-nav .nav-cta-full { display: none; }
          .lp-nav .nav-cta-short { display: inline; }
        }

        .lp .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: var(--font-sans), sans-serif; font-weight: 600; font-size: 14.5px;
          padding: 13px 24px; border-radius: 8px; text-decoration: none; white-space: nowrap;
          border: 1.5px solid transparent; cursor: pointer; transition: box-shadow 0.15s;
        }
        .lp .btn--primary { background: #232b31; color: #fff; }
        .lp .btn--primary:hover { box-shadow: 0 6px 20px -6px rgba(35,43,49,0.55); }
        .lp .btn--ghost { background: transparent; color: #232b31; border-color: #e2e6e8; }
        .lp .btn--ghost:hover { border-color: #8b939a; }
        .lp .btn--sm { padding: 9px 16px; font-size: 13.5px; border-radius: 7px; }

        .lp-hero { padding: 60px 0 52px; }
        .lp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
        @media (max-width: 940px) { .lp-hero-grid { grid-template-columns: 1fr; gap: 40px; } }
        .lp-hero h1 { font-size: clamp(28px, 4vw, 42px); line-height: 1.16; letter-spacing: -0.015em; margin: 0 0 20px; }
        .lp-hero .lede { font-size: 17px; color: #5b6570; line-height: 1.6; max-width: 46ch; margin-bottom: 28px; }
        .lp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .lp .trust-line { font-size: 12.5px; color: #8b939a; }

        .readout { background: #fff; border: 1px solid #e2e6e8; border-radius: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 12px 32px -16px rgba(35,43,49,0.18); overflow: hidden; }
        .readout-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e6e8; }
        .readout-prop { display: flex; align-items: center; gap: 10px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; position: relative; flex-shrink: 0; }
        .live-dot::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 1.5px solid #16a34a; opacity: 0.5; animation: lpRing 2s ease-out infinite; }
        @keyframes lpRing { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
        .readout-prop-name { font-family: var(--font-mono), monospace; font-size: 13.5px; font-weight: 600; }
        .readout-status { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; }
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

        .lp section { padding: 64px 0; }
        .lp .section--dim { background: #f3f6f7; border-top: 1px solid #e2e6e8; border-bottom: 1px solid #e2e6e8; }
        .lp .section-head { max-width: 640px; margin-bottom: 40px; }
        .lp .section-head h2 { font-size: clamp(23px, 3vw, 28px); margin-top: 14px; letter-spacing: -0.01em; }
        .lp .section-head p { color: #5b6570; font-size: 15.5px; margin-top: 10px; line-height: 1.6; }
        @media (max-width: 640px) {
          .lp section { padding: 44px 0; }
          .lp-hero { padding: 40px 0 36px; }
          .lp-cta-band { padding: 100px 0 260px; }
        }

        .lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 980px) { .lp-steps { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .lp-steps { grid-template-columns: 1fr; } }
        .lp-step-num { font-family: var(--font-mono), monospace; font-weight: 600; font-size: 13px; color: #fff; background: #232b31; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .lp-step h3 { font-size: 15.5px; margin-bottom: 8px; }
        .lp-step p { font-size: 13.5px; color: #5b6570; line-height: 1.6; }

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
        .lp-feature-cell h4 { font-size: 15.5px; }
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
        .lp-card-dot { width: 9px; height: 9px; border-radius: 50%; }
        .lp-card-title { font-family: var(--font-mono), monospace; font-size: 12px; color: #8b939a; margin-left: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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

        .lp-cta-band { background: #232b31; color: #fff; text-align: center; padding: 150px 0 320px; position: relative; overflow: hidden; }
        .lp-cta-chart { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 230px; }
        .lp-cta-marker { position: absolute; left: 53.7%; bottom: 23px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .lp-cta-marker-dot { width: 9px; height: 9px; border-radius: 50%; background: #ff5a5a; position: relative; }
        .lp-cta-marker-dot::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; border: 1.5px solid #ff5a5a; opacity: 0.6; animation: lpCtaRing 1.6s ease-out infinite; }
        @keyframes lpCtaRing { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }
        .lp-cta-marker-label { font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 600; color: #ffcccc; background: rgba(255,90,90,0.15); border: 1px solid rgba(255,90,90,0.35); padding: 3px 9px; border-radius: 5px; white-space: nowrap; }
        .lp-cta-band h2 { font-size: clamp(21px, 3vw, 29px); margin-bottom: 12px; position: relative; }
        .lp-cta-band p { color: rgba(255,255,255,0.65); margin-bottom: 26px; font-size: 15px; position: relative; }
        .lp-cta-band .btn--primary { background: #fffd73; color: #3a3800; position: relative; }
        .lp-cta-band .btn--ghost { border-color: rgba(255,255,255,0.3); color: #fff; position: relative; }
        @media (prefers-reduced-motion: reduce) { .lp-cta-marker-dot::after { animation: none; } }

        .lp-footer { background: #232b31; color: rgba(255,255,255,0.72); }
        .lp-footer-body { padding: 48px 0 30px; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
        @media (max-width: 780px) { .lp-footer-body { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .lp-footer-body { grid-template-columns: 1fr; } }
        .lp-footer-desc { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.6; max-width: 30ch; margin-top: 12px; }
        .lp-footer-addr { font-size: 12.5px; color: rgba(255,255,255,0.5); line-height: 1.7; margin-top: 14px; }
        .lp-footer-col h4 { font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 0 0 14px; }
        .lp-footer-col a { display: block; font-size: 13.5px; color: rgba(255,255,255,0.75); text-decoration: none; margin-bottom: 10px; }
        .lp-footer-col a:hover { color: #fff; }
        .lp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 0; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.45); }
        .lp-footer-bottom a { text-decoration: none; color: inherit; }
        .lp-footer-bottom a:hover { color: #fff; }
      `}</style>

      {/* Nav */}
      <nav className="lp-nav">
        <div className="wrap lp-nav-row">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <BrandWordmark size={19} dark />
          </Link>
          <div className="lp-nav-links">
            <a href="#jak-to-dziala">Jak to działa</a>
            <a href="#co-sprawdzamy">Co sprawdzamy</a>
            <a href="#dla-kogo">Dla kogo</a>
          </div>
          <div className="lp-nav-cta">
            {secondaryCta && <Link href={secondaryCta.href} className="login-link">{secondaryCta.label}</Link>}
            <Link href={primaryCta.href} className="btn btn--primary btn--sm">
              <span className="nav-cta-full">{primaryCta.label}</span>
              <span className="nav-cta-short">{user ? primaryCta.label : 'Zarejestruj się'}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero">
        <div className="wrap lp-hero-grid">
          <div>
            <h1>Codzienny <span className="underline-mark">monitoring danych</span> w Google Analytics 4</h1>
            <p className="lede">AlertGA4 codziennie weryfikuje Twoją usługę Google Analytics 4 i sprawdza dane, zdarzenia, parametry oraz anomalie na koncie, wysyłając alert na e-mail z podsumowaniem.</p>
            <div className="lp-hero-ctas">
              <Link href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</Link>
              <a href="#jak-to-dziala" className="btn btn--ghost">Zobacz jak to działa</a>
            </div>
            <p className="trust-line">prosta konfiguracja · codzienna weryfikacja · alerty i podsumowania</p>
          </div>

          <div className="readout">
            <div className="readout-head">
              <div className="readout-prop">
                <span className="live-dot" aria-hidden="true" />
                <span className="readout-prop-name">sklep-rowerowy.pl</span>
              </div>
              <span className="readout-status">sprawdzanie na żywo</span>
            </div>
            <div className="readout-body">
              <span className="score-num">94</span>
              <span className="score-of">/100</span>
              <div className="score-bar">
                <div className="score-track"><div className="score-fill" /></div>
                <div className="score-caption">+3 względem zeszłego tygodnia</div>
              </div>
            </div>
            <div className="readout-chips">
              <span className="chip"><span className="chip-dot chip-dot--ok" />eventy</span>
              <span className="chip"><span className="chip-dot chip-dot--ok" />ecommerce</span>
              <span className="chip"><span className="chip-dot chip-dot--ok" />ruch</span>
              <span className="chip"><span className="chip-dot chip-dot--warn" />parametry</span>
            </div>
            <div className="readout-foot">
              <span>ostatnie sprawdzenie: dziś, 23:04</span>
              <span>kolejne: jutro, 23:00</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Jak to działa */}
        <section id="jak-to-dziala" className="section--dim">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Proces</span>
              <h2>Jak to działa</h2>
              <p>Od zalogowania do pierwszego alertu — cztery kroki, żaden z nich nie wymaga zmian po stronie GA4.</p>
            </div>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <div className="lp-step" key={s.t}>
                  <div className="lp-step-num">{i + 1}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Co sprawdzamy */}
        <section id="co-sprawdzamy">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Zakres</span>
              <h2>Co sprawdzamy każdego dnia</h2>
              <p>Cztery kategorie, kilkanaście sprawdzeń — każde z realnym podglądem tego, co faktycznie mierzy.</p>
            </div>
            <div className="lp-feature-grid">
              <div className="lp-feature-cell">
                <div>
                  <h4>Zdarzenia</h4>
                  <p className="desc">Wykrywa brakujące eventy i sesje bez żadnego zdarzenia — zanim zauważysz to w raporcie.</p>
                </div>
                <div className="lp-feature-visual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EVENT_EXAMPLES.map(ev => <EventMiniCard key={ev.name} ev={ev} />)}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h4>Lejek e-commerce</h4>
                  <p className="desc">Pilnuje ciągłości zdarzeń od pierwszego wejścia na produkt do zakupu — i spadków wolumenu na każdym etapie.</p>
                </div>
                <div className="lp-feature-visual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ECOMMERCE_EXAMPLES.map(ev => <EventMiniCard key={ev.name} ev={ev} />)}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h4>Ruch i anomalie</h4>
                  <p className="desc">Self-referral, skoki ruchu direct i podejrzana aktywność botów w nocy — wykryte tego samego dnia.</p>
                </div>
                <div className="lp-feature-visual mini-spark">
                  {[8, 11, 7, 9, 6, 10, 44, 38, 9, 7, 12, 8].map((h, i) => (
                    <div key={i} className={`mini-spark-bar${h > 30 ? ' spike' : ''}`} style={{ height: h }} />
                  ))}
                </div>
              </div>
              <div className="lp-feature-cell">
                <div>
                  <h4>Pokrycie parametrów</h4>
                  <p className="desc">Weryfikacja czy zdefiniowane parametry zdarzeń faktycznie docierają ze zdarzeniem i w jakim procencie.</p>
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
        <section id="problem" className="section--dim">
          <div className="wrap wrap--narrow">
            <div className="section-head">
              <span className="eyebrow">Problem</span>
              <h2>GA4 nie wysyła alertu, gdy coś się psuje</h2>
              <p>Popsute śledzenie nie rzuca błędem — po prostu cicho zwraca gorsze dane. Zwykle dowiadujesz się o tym od klienta, kilka tygodni za późno.</p>
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

        {/* Podgląd — trend + dashboard */}
        <section>
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Podgląd</span>
              <h2>Wynik, trend i wszystkie projekty w jednym miejscu</h2>
              <p>Widzisz nie tylko aktualny wynik, ale i to, jak zmieniał się w czasie — oraz status każdej monitorowanej usługi naraz.</p>
            </div>
            <div className="lp-preview-grid">
              <div className="lp-card">
                <div className="lp-card-bar">
                  <div className="lp-card-bar-left">
                    <span className="lp-card-dot" style={{ background: '#dc2626' }} />
                    <span className="lp-card-dot" style={{ background: '#ea580c' }} />
                    <span className="lp-card-dot" style={{ background: '#16a34a' }} />
                    <span className="lp-card-title">sklep-rowerowy.pl — 14 dni</span>
                  </div>
                </div>
                <div className="lp-trend-body">
                  <div className="lp-trend-top">
                    <span className="lp-trend-score">94</span>
                    <span className="lp-trend-caption">próg alertu: 70</span>
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
                    <span className="lp-card-dot" style={{ background: '#dc2626' }} />
                    <span className="lp-card-dot" style={{ background: '#ea580c' }} />
                    <span className="lp-card-dot" style={{ background: '#16a34a' }} />
                    <span className="lp-card-title">alertga4.bettersteps.pl/dashboard</span>
                  </div>
                  <span className="lp-card-tag">+ nowy projekt</span>
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

        {/* Dla kogo */}
        <section id="dla-kogo">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Zastosowanie</span>
              <h2>Dla kogo</h2>
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

        {/* CTA końcowe */}
        <section className="lp-cta-band">
          <svg className="lp-cta-chart" viewBox="0 0 1080 230" preserveAspectRatio="none" width="100%" height="230" aria-hidden="true">
            <polygon points="0,92 100,88 200,98 300,82 400,92 500,80 540,86 580,207 630,200 720,154 820,120 920,98 1020,86 1080,80 1080,230 0,230" fill="#fffd73" opacity="0.04" />
            <polyline points="0,92 100,88 200,98 300,82 400,92 500,80 540,86 580,207 630,200 720,154 820,120 920,98 1020,86 1080,80"
              fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="lp-cta-marker">
            <span className="lp-cta-marker-label">AlertGA4</span>
            <span className="lp-cta-marker-dot" />
          </div>
          <div className="wrap wrap--narrow">
            <h2>Zacznij monitorować poprawność danych w GA4</h2>
            <p>Logowanie kontem Google zajmuje mniej niż minutę.</p>
            <div className="lp-hero-ctas" style={{ justifyContent: 'center', marginBottom: 0 }}>
              <Link href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</Link>
              {secondaryCta && <Link href={secondaryCta.href} className="btn btn--ghost">{secondaryCta.label}</Link>}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="wrap lp-footer-body">
          <div>
            <BrandWordmark size={18} dark />
            <div className="lp-footer-addr">
              Bettersteps Sp. z o.o.<br />
              ul. Domaniewska 47, 02-672 Warszawa<br />
              KRS 0001011888 · NIP 5214000359
            </div>
          </div>
          <div className="lp-footer-col">
            <h4>Produkt</h4>
            <a href="#jak-to-dziala">Jak to działa</a>
            <a href="#co-sprawdzamy">Co sprawdzamy</a>
            <a href="#dla-kogo">Dla kogo</a>
          </div>
          <div className="lp-footer-col">
            <h4>Prawne</h4>
            <Link href="/privacy">Polityka prywatności</Link>
            <Link href="/terms">Regulamin</Link>
          </div>
          <div className="lp-footer-col">
            <h4>Kontakt</h4>
            <a href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
            <a href="https://www.bettersteps.pl">www.bettersteps.pl</a>
          </div>
        </div>
        <div className="wrap lp-footer-bottom">
          <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
        </div>
      </footer>
    </div>
  )
}
