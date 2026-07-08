import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BrandWordmark from '@/components/ui/BrandWordmark'

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

const STEPS = [
  { t: 'Logujesz się kontem Google', d: 'Autoryzujesz AlertGA4 z dostępem wyłącznie do odczytu Google Analytics — jak rola „Viewer" w GA4. Zero zmian w Twojej usłudze.' },
  { t: 'Dodajesz usługę GA4', d: 'Wybierasz dowolną usługę, do której masz już dostęp. AlertGA4 od razu uruchamia pierwszy zestaw sprawdzeń.' },
  { t: 'Dostajesz alert na czas', d: 'Wynik jakości spada poniżej progu? Dostajesz e-mail z jasnym opisem co się popsuło — zanim trafi to do raportu.' },
]

const CHECKS = [
  { t: 'Brakujące eventy', d: 'Wykrywa, gdy skonfigurowane zdarzenia przestają się rejestrować.' },
  { t: 'Duplikaty zakupów', d: 'Łapie podwójnie liczone eventy purchase zawyżające przychód.' },
  { t: 'Lejek e-commerce', d: 'Pilnuje ciągłości zdarzeń od view_item po purchase.' },
  { t: 'Ruch self-referral', d: 'Sygnalizuje, gdy własna domena staje się źródłem odesłania.' },
  { t: 'Anomalie ruchu direct', d: 'Wychwytuje nagłe skoki ruchu bezpośredniego.' },
  { t: 'Ruch botów w nocy', d: 'Filtruje podejrzaną aktywność spoza godzin realnego ruchu.' },
  { t: 'Puste tytuły stron', d: 'Wskazuje strony wysyłające zdarzenia bez tytułu.' },
  { t: 'Sesje bez zdarzeń', d: 'Wyłapuje sesje, w których nie odpaliło żadne zdarzenie.' },
  { t: 'Pokrycie parametrów', d: 'Sprawdza, czy zdefiniowane parametry faktycznie docierają.' },
]

const DASHBOARD_ROWS = [
  { name: 'sklep-rowerowy.pl', prop: 'properties/312894701', trend: '▲ 3', up: true, score: 94, bg: '#f0fdf4', fg: '#166534' },
  { name: 'kancelaria-nowak.pl', prop: 'properties/298117440', trend: '▲ 1', up: true, score: 87, bg: '#f0fdf4', fg: '#16a34a' },
  { name: 'hotel-mazury.pl', prop: 'properties/305562019', trend: '▼ 14', up: false, score: 68, bg: '#fff7ed', fg: '#ea580c' },
  { name: 'fitness-club-warszawa.pl', prop: 'properties/311098823', trend: '▼ 26', up: false, score: 41, bg: '#fef2f2', fg: '#dc2626' },
]

const AUDIENCE = [
  { t: 'Agencje marketingowe', d: 'Jeden widok z wynikiem jakości dla wszystkich usług GA4 klientów, zamiast ręcznego przeglądania każdej z osobna raz na kwartał.' },
  { t: 'E-commerce', d: 'Pilnuje lejka zakupowego i eventów ecommerce, żeby błąd w tagowaniu nie zniekształcił raportu przychodu przed spotkaniem zarządu.' },
  { t: 'Zespoły analityczne', d: 'Wczesne ostrzeżenie o anomaliach danych, zanim trafią do dashboardów i decyzji biznesowych opartych na złych liczbach.' },
]

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
        .lp h1, .lp h2, .lp h3 { font-family: var(--font-sans), sans-serif; font-weight: 700; text-wrap: balance; margin: 0; }
        .lp p { margin: 0; }
        .lp a { color: inherit; }
        .mono-inline { font-family: var(--font-mono), monospace; font-size: 0.94em; }

        .lp .eyebrow {
          font-family: var(--font-mono), monospace; font-weight: 500; font-size: 12px;
          letter-spacing: 0.09em; text-transform: uppercase; color: #c23b34;
          display: flex; align-items: center; gap: 8px;
        }
        .lp .eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #ff8282; flex-shrink: 0; }

        .lp-nav { position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e6e8; }
        .lp-nav-row { display: flex; align-items: center; justify-content: space-between; height: 68px; }
        .lp-nav-links { display: flex; align-items: center; gap: 30px; }
        .lp-nav-links a { font-size: 14px; font-weight: 500; text-decoration: none; color: #5b6570; }
        .lp-nav-links a:hover { color: #232b31; }
        .lp-nav-cta { display: flex; align-items: center; gap: 18px; }
        .lp-nav-cta .login-link { font-size: 14px; font-weight: 600; text-decoration: none; color: #232b31; white-space: nowrap; }
        @media (max-width: 860px) { .lp-nav-links { display: none; } }

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

        .lp-hero { padding: 68px 0 60px; }
        .lp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
        @media (max-width: 940px) { .lp-hero-grid { grid-template-columns: 1fr; gap: 40px; } }
        .lp-hero h1 { font-size: clamp(28px, 4vw, 42px); line-height: 1.16; letter-spacing: -0.015em; margin: 16px 0 20px; }
        .lp-hero .lede { font-size: 17px; color: #5b6570; line-height: 1.6; max-width: 46ch; margin-bottom: 28px; }
        .lp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .lp .trust-line { font-size: 12.5px; color: #8b939a; }
        .underline-mark { background: linear-gradient(transparent 62%, #fffd73 62%); padding: 0 2px; }

        .readout { background: #fff; border: 1px solid #e2e6e8; border-radius: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 12px 32px -16px rgba(35,43,49,0.18); overflow: hidden; }
        .readout-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e6e8; }
        .readout-prop { display: flex; align-items: center; gap: 10px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; position: relative; flex-shrink: 0; }
        .live-dot::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 1.5px solid #16a34a; opacity: 0.5; animation: lpRing 2s ease-out infinite; }
        @keyframes lpRing { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
        .readout-prop-name { font-family: var(--font-mono), monospace; font-size: 13.5px; font-weight: 600; }
        .readout-status { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; }
        .readout-body { padding: 26px 20px 22px; display: flex; align-items: flex-end; gap: 18px; }
        .score-num { font-family: var(--font-mono), monospace; font-weight: 600; font-size: 56px; line-height: 0.9; color: #166534; }
        .score-of { font-family: var(--font-mono), monospace; font-size: 18px; color: #8b939a; padding-bottom: 8px; }
        .score-bar { flex: 1; padding-bottom: 12px; }
        .score-track { height: 6px; border-radius: 4px; background: #eaeef0; overflow: hidden; margin-bottom: 8px; }
        .score-fill { height: 100%; width: 94%; background: linear-gradient(90deg, #16a34a, #166534); border-radius: 4px; }
        .score-caption { font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; }
        .readout-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px 20px; }
        .chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono), monospace; font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 999px; background: #f3f6f7; border: 1px solid #e2e6e8; }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chip-dot--ok { background: #16a34a; }
        .chip-dot--warn { background: #ea580c; }
        .readout-foot { padding: 12px 20px; border-top: 1px solid #e2e6e8; background: #f3f6f7; font-family: var(--font-mono), monospace; font-size: 11.5px; color: #8b939a; display: flex; justify-content: space-between; }

        .lp section { padding: 68px 0; }
        .lp .section--dim { background: #f3f6f7; border-top: 1px solid #e2e6e8; border-bottom: 1px solid #e2e6e8; }
        .lp .section-head { max-width: 620px; margin-bottom: 40px; }
        .lp .section-head h2 { font-size: clamp(23px, 3vw, 28px); margin-top: 14px; letter-spacing: -0.01em; }
        .lp .section-head p { color: #5b6570; font-size: 15.5px; margin-top: 10px; line-height: 1.6; }

        .lp-log { display: flex; flex-direction: column; border-top: 1px solid #e2e6e8; }
        .lp-log-row { display: grid; grid-template-columns: 120px 1fr; gap: 24px; padding: 22px 0; border-bottom: 1px solid #e2e6e8; }
        @media (max-width: 700px) { .lp-log-row { grid-template-columns: 1fr; gap: 6px; } }
        .lp-log-tag { font-family: var(--font-mono), monospace; font-size: 12px; color: #c23b34; display: flex; align-items: flex-start; gap: 8px; padding-top: 2px; }
        .lp-log-tag .dot { width: 7px; height: 7px; border-radius: 50%; background: #ff8282; margin-top: 5px; flex-shrink: 0; }
        .lp-log-title { font-weight: 700; font-size: 15.5px; margin-bottom: 5px; }
        .lp-log-desc { font-size: 14px; color: #5b6570; line-height: 1.6; max-width: 60ch; }

        .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        @media (max-width: 800px) { .lp-steps { grid-template-columns: 1fr; gap: 30px; } }
        .lp-step-num { font-family: var(--font-mono), monospace; font-weight: 600; font-size: 13px; color: #fff; background: #232b31; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .lp-step h3 { font-size: 16px; margin-bottom: 8px; }
        .lp-step p { font-size: 14px; color: #5b6570; line-height: 1.65; }

        .lp-checks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e2e6e8; border: 1px solid #e2e6e8; border-radius: 14px; overflow: hidden; }
        @media (max-width: 900px) { .lp-checks-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .lp-checks-grid { grid-template-columns: 1fr; } }
        .lp-check-cell { background: #fff; padding: 20px 22px; }
        .lp-check-cell .dot { width: 6px; height: 6px; border-radius: 50%; background: #fffd73; box-shadow: 0 0 0 3px rgba(255,253,115,0.35); margin-bottom: 12px; }
        .lp-check-cell h4 { font-size: 14.5px; font-weight: 700; margin-bottom: 6px; }
        .lp-check-cell p { font-size: 13px; color: #5b6570; line-height: 1.55; }

        .lp-panel { background: #fff; border: 1px solid #e2e6e8; border-radius: 16px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 12px 32px -16px rgba(35,43,49,0.18); overflow: hidden; }
        .lp-panel-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #e2e6e8; }
        .lp-panel-bar-left { display: flex; align-items: center; gap: 8px; }
        .lp-panel-dot { width: 9px; height: 9px; border-radius: 50%; }
        .lp-panel-title { font-family: var(--font-mono), monospace; font-size: 12px; color: #8b939a; margin-left: 6px; }
        .lp-panel-new { font-family: var(--font-mono), monospace; font-size: 12px; color: #c23b34; }
        .lp-row { display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center; padding: 15px 20px; border-bottom: 1px solid #e2e6e8; }
        .lp-row:last-child { border-bottom: none; }
        .lp-row-name { font-weight: 600; font-size: 14.5px; }
        .lp-row-domain { font-family: var(--font-mono), monospace; font-size: 12px; color: #8b939a; margin-top: 2px; }
        .lp-row-trend { font-family: var(--font-mono), monospace; font-size: 12.5px; }
        .lp-row-trend.up { color: #166534; }
        .lp-row-trend.down { color: #dc2626; }
        .lp-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 7px; font-family: var(--font-mono), monospace; font-weight: 600; font-size: 14px; }
        @media (max-width: 640px) { .lp-row { grid-template-columns: 1fr auto; } .lp-row-trend { display: none; } }

        .lp-audience { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        @media (max-width: 800px) { .lp-audience { grid-template-columns: 1fr; } }
        .lp-audience-card { padding: 26px 24px; border: 1px solid #e2e6e8; border-radius: 14px; background: #fff; }
        .lp-audience-card h3 { font-size: 15.5px; margin-bottom: 10px; }
        .lp-audience-card p { font-size: 13.5px; color: #5b6570; line-height: 1.65; }

        .lp-cta-band { background: #232b31; color: #fff; text-align: center; padding: 72px 0; position: relative; overflow: hidden; }
        .lp-cta-band::before { content: ""; position: absolute; top: -60%; right: -10%; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(255,253,115,0.18), transparent 70%); }
        .lp-cta-band::after { content: ""; position: absolute; bottom: -60%; left: -8%; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, rgba(255,130,130,0.22), transparent 70%); }
        .lp-cta-band h2 { font-size: clamp(21px, 3vw, 29px); margin-bottom: 12px; position: relative; }
        .lp-cta-band p { color: rgba(255,255,255,0.65); margin-bottom: 26px; font-size: 15px; position: relative; }
        .lp-cta-band .btn--primary { background: #fffd73; color: #3a3800; position: relative; }
        .lp-cta-band .btn--ghost { border-color: rgba(255,255,255,0.3); color: #fff; position: relative; }

        .lp-footer { background: #232b31; color: rgba(255,255,255,0.72); padding: 32px 0; }
        .lp-footer-row { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; justify-content: space-between; font-size: 13px; }
        .lp-footer-links { display: flex; gap: 22px; flex-wrap: wrap; }
        .lp-footer-links a { text-decoration: none; color: inherit; }
        .lp-footer-links a:hover { color: #fff; }
      `}</style>

      {/* Nav */}
      <nav className="lp-nav">
        <div className="wrap lp-nav-row">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <BrandWordmark size={19} />
          </Link>
          <div className="lp-nav-links">
            <a href="#problem">Problem</a>
            <a href="#jak-to-dziala">Jak to działa</a>
            <a href="#co-sprawdzamy">Co sprawdzamy</a>
            <a href="#dla-kogo">Dla kogo</a>
          </div>
          <div className="lp-nav-cta">
            {secondaryCta && <Link href={secondaryCta.href} className="login-link">{secondaryCta.label}</Link>}
            <Link href={primaryCta.href} className="btn btn--primary btn--sm">{primaryCta.label}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero">
        <div className="wrap lp-hero-grid">
          <div>
            <span className="eyebrow">Monitoring GA4 · codziennie</span>
            <h1>Twoje śledzenie GA4 może być zepsute <span className="underline-mark">już teraz</span> — i wygląda dokładnie tak samo, jak wtedy, gdy działa.</h1>
            <p className="lede">AlertGA4 codziennie prześwietla Twoją usługę Google Analytics 4 — eventy, lejek e-commerce, ruch, parametry — i wysyła alert e-mail, zanim popsute dane trafią do raportu klienta.</p>
            <div className="lp-hero-ctas">
              <Link href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</Link>
              <a href="#jak-to-dziala" className="btn btn--ghost">Zobacz jak to działa</a>
            </div>
            <p className="trust-line">logowanie <span className="mono-inline">kontem Google</span> · dostęp tylko do odczytu · zero konfiguracji po stronie klienta</p>
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
        {/* Problem */}
        <section id="problem">
          <div className="wrap wrap--narrow">
            <div className="section-head">
              <span className="eyebrow">Problem</span>
              <h2>GA4 nie wysyła alertu, gdy coś się psuje</h2>
              <p>Popsute śledzenie nie rzuca błędem — po prostu cicho zwraca gorsze dane. Zwykle dowiadujesz się o tym od klienta, kilka tygodni za późno. Kilka przykładów, które AlertGA4 wyłapuje tego samego dnia:</p>
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

        {/* Jak to działa */}
        <section id="jak-to-dziala" className="section--dim">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Proces</span>
              <h2>Jak to działa</h2>
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
              <p>Kilkanaście automatycznych kontroli jakości uruchamianych codziennie dla każdej monitorowanej usługi GA4.</p>
            </div>
            <div className="lp-checks-grid">
              {CHECKS.map(c => (
                <div className="lp-check-cell" key={c.t}>
                  <span className="dot" />
                  <h4>{c.t}</h4>
                  <p>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Podgląd produktu */}
        <section className="section--dim">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Podgląd</span>
              <h2>Wszystkie projekty, jeden widok</h2>
              <p>Panel pokazuje wynik jakości, trend tydzień do tygodnia i status każdej monitorowanej usługi — bez klikania po osobnych raportach.</p>
            </div>
            <div className="lp-panel">
              <div className="lp-panel-bar">
                <div className="lp-panel-bar-left">
                  <span className="lp-panel-dot" style={{ background: '#dc2626' }} />
                  <span className="lp-panel-dot" style={{ background: '#ea580c' }} />
                  <span className="lp-panel-dot" style={{ background: '#16a34a' }} />
                  <span className="lp-panel-title">alertga4.bettersteps.pl/dashboard</span>
                </div>
                <span className="lp-panel-new">+ nowy projekt</span>
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
          <div className="wrap wrap--narrow">
            <h2>Sprawdź jakość implementacji GA4 już dziś</h2>
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
        <div className="wrap lp-footer-row">
          <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
          <div className="lp-footer-links">
            <Link href="/privacy">Polityka prywatności</Link>
            <Link href="/terms">Regulamin</Link>
            <a href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
            <a href="https://www.bettersteps.pl">www.bettersteps.pl</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
