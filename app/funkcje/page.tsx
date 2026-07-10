import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import FeatureSubnav from '@/components/marketing/FeatureSubnav'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'

export const metadata = {
  title: 'Funkcje',
  description: 'Co AlertGA4 sprawdza każdego dnia w Twojej usłudze GA4: monitoring danych głównych, weryfikacja parametrów, zdarzenia niestandardowe i e-commerce, alert mailowy, podsumowanie projektów i kreator konfiguracji.',
}

const SUBNAV = [
  { href: '#monitoring-danych', label: 'Monitoring danych głównych' },
  { href: '#parametry', label: 'Weryfikacja parametrów' },
  { href: '#zdarzenia-niestandardowe', label: 'Zdarzenia niestandardowe' },
  { href: '#ecommerce', label: 'Zdarzenia e-commerce' },
  { href: '#alert-mailowy', label: 'Alert mailowy' },
  { href: '#podsumowanie', label: 'Podsumowanie projektów' },
  { href: '#kreator', label: 'Kreator konfiguracji' },
]

export default async function FunkcjePage() {
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
        .email-toolbar { background: #f3f6f7; border-bottom: 1px solid #e2e6e8; padding: 9px 14px; display: flex; gap: 6px; }
        .email-toolbar span { width: 8px; height: 8px; border-radius: 50%; background: #e2e6e8; }
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

      `}</style>

      <LandingNav primaryCta={primaryCta} secondaryCta={secondaryCta} user={!!user} />

      <main>
        <section className="fx-hero">
          <div className="wrap wrap--narrow">
            <div className="eyebrow">Funkcje AlertGA4</div>
            <h1>Wszystko, co AlertGA4 sprawdza w Twojej usłudze GA4 każdego dnia</h1>
            <p>Od monitoringu ruchu po alert mailowy, zanim popsute dane trafią do raportu.</p>
          </div>
        </section>

        <div className="fx-subnav">
          <div className="wrap">
            <FeatureSubnav items={SUBNAV} />
          </div>
        </div>

        <section className="fx-feature" id="monitoring-danych">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">01</div>
                <h2>Monitoring danych głównych</h2>
                <p>Codziennie porównujemy ruch, zaangażowanie i konwersje tydzień do tygodnia, żeby złapać anomalię, zanim zauważysz ją w miesięcznym raporcie.</p>
                <ul className="fx-feature-list">
                  <li>Self-referral i skoki ruchu direct po migracji domeny</li>
                  <li>Anomalie współczynnika odrzuceń i konwersji WoW</li>
                  <li>Podejrzana aktywność botów w środku nocy</li>
                  <li>Nowe kraje w top 5 źródeł ruchu</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="core-grid">
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Self-referral</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Bounce rate</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#ea580c' }} />Direct traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Conversion rate</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Page title</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#dc2626' }} />Bot traffic</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Purchase duplicates</div>
                  <div className="core-chip"><span className="dot" style={{ background: '#16a34a' }} />Geo anomaly</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="parametry">
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">02</div>
                <h2>Weryfikacja parametrów</h2>
                <p>Zdarzenie może „działać", a mimo to nie nieść kluczowych danych. Sprawdzamy, czy zdefiniowane parametry faktycznie docierają razem ze zdarzeniem i w jakim procencie.</p>
                <ul className="fx-feature-list">
                  <li>Pokrycie parametru liczone tydzień do tygodnia</li>
                  <li>Ostrzeżenie, gdy parametr nie jest zarejestrowany jako custom dimension</li>
                  <li>Obsługa parametrów standardowych i customowych</li>
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
                    <div className="cov-label"><span>coupon_code</span><b>12%</b></div>
                    <div className="cov-track"><div className="cov-fill warn" style={{ width: '12%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="zdarzenia-niestandardowe">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">03</div>
                <h2>Monitoring zdarzeń niestandardowych</h2>
                <p>Formularze, logowania, artykuły przeczytane do końca. Definiujesz własne zdarzenia do pilnowania, a AlertGA4 codziennie sprawdza ich obecność i wolumen.</p>
                <ul className="fx-feature-list">
                  <li>Alert, gdy zdarzenie milknie z dnia na dzień</li>
                  <li>Wykrywanie spadków wolumenu tydzień do tygodnia</li>
                  <li>Sugestie zdarzeń na podstawie tego, co realnie widać w GA4</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="evt-grid">
                  <div className="evt-card"><div className="evt-name">form_send</div><div className="evt-num">3 420</div><div className="evt-delta up">▲ 14.8%</div></div>
                  <div className="evt-card"><div className="evt-name">login</div><div className="evt-num">7 772</div><div className="evt-delta down">▼ 42.0%</div></div>
                  <div className="evt-card"><div className="evt-name">sign_up</div><div className="evt-num">890</div><div className="evt-delta up">▲ 17.1%</div></div>
                  <div className="evt-card"><div className="evt-name">article_read</div><div className="evt-num">45 320</div><div className="evt-delta up">▲ 7.6%</div></div>
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
                <h2>Monitoring zdarzeń e-commerce</h2>
                <p>Pilnujemy ciągłości całego lejka, od pierwszego wejścia na produkt do zakupu, oraz spadków wolumenu na każdym etapie osobno.</p>
                <ul className="fx-feature-list">
                  <li>14 standardowych zdarzeń e-commerce GA4 pod jednym przełącznikiem</li>
                  <li>Wykrywanie zdublowanego eventu purchase</li>
                  <li>Alert przy zniknięciu zdarzenia z części katalogu</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="evt-grid">
                  <div className="evt-card"><div className="evt-name">view_item</div><div className="evt-num">8 200</div><div className="evt-delta up">▲ 3.8%</div></div>
                  <div className="evt-card"><div className="evt-name">add_to_cart</div><div className="evt-num">3 204</div><div className="evt-delta up">▲ 5.2%</div></div>
                  <div className="evt-card"><div className="evt-name">begin_checkout</div><div className="evt-num">1 118</div><div className="evt-delta down">▼ 9.4%</div></div>
                  <div className="evt-card"><div className="evt-name">purchase</div><div className="evt-num">842</div><div className="evt-delta up">▲ 1.1%</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="alert-mailowy">
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">05</div>
                <h2>Alert mailowy</h2>
                <p>Gdy wynik jakości spada poniżej ustalonego progu, dostajesz e-mail z konkretną diagnozą, nie tylko liczbą. Bez logowania się codziennie, żeby to sprawdzić.</p>
                <ul className="fx-feature-list">
                  <li>Alert per projekt, na adres, który sam skonfigurujesz</li>
                  <li>Zbiorczy dzienny digest dla właściciela konta</li>
                  <li>Osobne powiadomienie, gdy wygaśnie połączenie z Google</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="email-frame">
                  <div className="email-toolbar"><span style={{ background: '#dc2626' }} /><span style={{ background: '#ea580c' }} /><span style={{ background: '#16a34a' }} /></div>
                  <div className="email-body">
                    <div className="email-score-row">
                      <span className="email-score">68</span>
                      <div><div className="email-score-tag">Poniżej progu</div><div style={{ fontSize: 11, color: '#5b6570' }}>hotel-mazury.pl</div></div>
                    </div>
                    <div className="email-issue"><span className="tag">FAIL</span><div>Brak zdarzeń <span className="mono-inline">add_to_cart</span> w ostatnich 24h</div></div>
                    <div className="email-issue"><span className="tag">FAIL</span><div>3.2% sesji z self-referral</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="podsumowanie">
          <div className="wrap">
            <div className="fx-feature-grid flip">
              <div className="fx-feature-text">
                <div className="fx-feature-num">06</div>
                <h2>Podsumowanie wszystkich projektów</h2>
                <p>Jeden widok wszystkich monitorowanych usług GA4 z aktualnym wynikiem i trendem, zamiast klikania w każdą osobno.</p>
                <ul className="fx-feature-list">
                  <li>Sortowanie od najgorszego wyniku</li>
                  <li>Trend WoW przy każdym projekcie</li>
                  <li>Szczególnie przydatne przy obsłudze wielu klientów naraz</li>
                </ul>
              </div>
              <div className="fx-feature-visual">
                <div className="proj-table">
                  <div className="proj-row">
                    <div><div className="proj-name">sklep-rowerowy.pl</div><div className="proj-domain">properties/312894701</div></div>
                    <div className="mono-inline" style={{ color: '#166534' }}>▲ 3</div>
                    <div className="proj-badge" style={{ background: '#f0fdf4', color: '#166534' }}>94</div>
                  </div>
                  <div className="proj-row">
                    <div><div className="proj-name">kancelaria-nowak.pl</div><div className="proj-domain">properties/298117440</div></div>
                    <div className="mono-inline" style={{ color: '#166534' }}>▲ 1</div>
                    <div className="proj-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>87</div>
                  </div>
                  <div className="proj-row">
                    <div><div className="proj-name">hotel-mazury.pl</div><div className="proj-domain">properties/305562019</div></div>
                    <div className="mono-inline" style={{ color: '#c23b34' }}>▼ 14</div>
                    <div className="proj-badge" style={{ background: '#fff7ed', color: '#ea580c' }}>68</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-feature" id="kreator" style={{ borderBottom: 'none' }}>
          <div className="wrap">
            <div className="fx-feature-grid">
              <div className="fx-feature-text">
                <div className="fx-feature-num">07</div>
                <h2>Kreator konfiguracji z podpowiedziami z GA4</h2>
                <p>Zamiast ślepego wpisywania nazw zdarzeń, kreator czyta realne dane z podłączonej usługi GA4 i podpowiada, co warto monitorować, wraz z wolumenem.</p>
                <ul className="fx-feature-list">
                  <li>Sugestie zdarzeń i parametrów na bazie ostatnich 30 dni</li>
                  <li>To samo dopięte punktowo w edycji, bez przechodzenia kreatora od nowa</li>
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
                  <div className="wiz-row"><span className="mono-inline" style={{ fontWeight: 600 }}>purchase</span><span className="wiz-tag">standardowe</span><span className="wiz-vol">1 842 / 30 dni</span></div>
                  <div className="wiz-row"><span className="mono-inline" style={{ fontWeight: 600 }}>sign_up</span><span className="wiz-tag">standardowe</span><span className="wiz-vol">412 / 30 dni</span></div>
                  <div className="wiz-row off"><span className="mono-inline" style={{ fontWeight: 600 }}>scroll</span><span className="wiz-tag">standardowe</span><span className="wiz-vol">28 410 / 30 dni</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
