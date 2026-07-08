import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CHECKS = [
  { t: 'Brakujące eventy', d: 'Wykrywa, gdy skonfigurowane zdarzenia przestają się rejestrować w GA4.' },
  { t: 'Duplikaty zakupów', d: 'Łapie podwójnie liczone eventy purchase, które zawyżają przychód w raportach.' },
  { t: 'Lejek e-commerce', d: 'Pilnuje ciągłości zdarzeń od view_item po purchase — i spadków wolumenu.' },
  { t: 'Ruch self-referral', d: 'Sygnalizuje, gdy własna domena pojawia się jako źródło odesłania.' },
  { t: 'Anomalie ruchu direct', d: 'Wychwytuje nagłe skoki ruchu bezpośredniego — częsty objaw błędu tagowania.' },
  { t: 'Ruch botów w nocy', d: 'Filtruje podejrzaną aktywność spoza godzin realnego ruchu użytkowników.' },
  { t: 'Puste tytuły stron', d: 'Wskazuje strony wysyłające zdarzenia bez tytułu — trudne do zdiagnozowania inaczej.' },
  { t: 'Sesje bez zdarzeń', d: 'Wyłapuje sesje, w których w ogóle nie odpaliło żadne zdarzenie.' },
  { t: 'Pokrycie parametrów', d: 'Sprawdza, czy zdefiniowane parametry zdarzeń faktycznie docierają z danymi.' },
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#111827' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>QS</div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>AlertGA4</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#jak-to-dziala" style={{ fontSize: 13, color: '#4b5563', textDecoration: 'none' }}>Jak to działa</a>
            <a href="#co-sprawdzamy" style={{ fontSize: 13, color: '#4b5563', textDecoration: 'none' }}>Co sprawdzamy</a>
            {secondaryCta && (
              <Link href={secondaryCta.href} style={{ fontSize: 13, fontWeight: 600, color: '#111827', textDecoration: 'none' }}>
                {secondaryCta.label}
              </Link>
            )}
            <Link href={primaryCta.href} style={{ fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#16a34a', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
              {primaryCta.label}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1 }}>
        <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, margin: '0 auto 20px', maxWidth: 720 }}>
            Wiedz, kiedy Twoje śledzenie GA4 się psuje — nie za kilka tygodni.
          </h1>
          <p style={{ fontSize: 17, color: '#4b5563', lineHeight: 1.6, margin: '0 auto 32px', maxWidth: 620 }}>
            AlertGA4 codziennie sprawdza jakość implementacji Google Analytics 4 — brakujące eventy, zdublowane zakupy,
            anomalie ruchu i niekompletne parametry — i wysyła alert e-mail, zanim popsute dane trafią do raportu klienta.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <Link href={primaryCta.href} style={{ display: 'inline-block', backgroundColor: '#16a34a', color: '#fff', fontWeight: 600, padding: '13px 26px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href} style={{ display: 'inline-block', color: '#111827', fontWeight: 600, padding: '13px 26px', borderRadius: 8, textDecoration: 'none', fontSize: 15, border: '1px solid #e5e7eb' }}>
                {secondaryCta.label}
              </Link>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            Logowanie kontem Google · dostęp tylko do odczytu GA4 · zero konfiguracji po stronie klienta
          </p>
        </section>

        {/* Jak to działa */}
        <section id="jak-to-dziala" style={{ backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', textAlign: 'center', margin: '0 0 32px' }}>
              Jak to działa
            </h2>
            <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {[
                { n: '1', t: 'Zaloguj się kontem Google', d: 'Autoryzujesz AlertGA4 z dostępem wyłącznie do odczytu Google Analytics — dokładnie taki poziom jak rola „Viewer” w GA4. Nigdy nie zmieniamy konfiguracji ani danych Twojej usługi GA4.' },
                { n: '2', t: 'Dodaj usługę GA4 do monitorowania', d: 'Wybierz dowolną usługę GA4, do której masz już dostęp. AlertGA4 codziennie uruchamia zestaw sprawdzeń: oczekiwane eventy, lejek e-commerce, self-referrale, ruch botów i inne.' },
                { n: '3', t: 'Dostań alert, zanim to zaboli', d: 'Każdy projekt dostaje wynik jakości i trend. Gdy spadnie poniżej ustalonego progu, AlertGA4 wysyła e-mail z jasnym opisem co się popsuło — do Ciebie, a opcjonalnie też do klienta.' },
              ].map(step => (
                <div key={step.n}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{step.n}</div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{step.t}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Co sprawdzamy */}
        <section id="co-sprawdzamy" style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 24px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', textAlign: 'center', margin: '0 0 8px' }}>
            Co sprawdzamy
          </h2>
          <p style={{ fontSize: 15, color: '#4b5563', textAlign: 'center', margin: '0 0 36px' }}>
            Kilkanaście automatycznych kontroli jakości, uruchamianych codziennie dla każdej monitorowanej usługi GA4.
          </p>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {CHECKS.map(c => (
              <div key={c.t} style={{ padding: '16px 18px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{c.t}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dla kogo */}
        <section style={{ backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', textAlign: 'center', margin: '0 0 32px' }}>
              Dla kogo
            </h2>
            <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {[
                { t: 'Agencje marketingowe', d: 'Jedno miejsce z wynikiem jakości dla wszystkich usług GA4 klientów, zamiast ręcznego przeglądania każdej z osobna.' },
                { t: 'E-commerce', d: 'Pilnuje lejka zakupowego i eventów ecommerce, żeby błąd w tagowaniu nie zniekształcił raportów przychodu.' },
                { t: 'Zespoły analityczne', d: 'Wczesne ostrzeżenie o anomaliach danych, zanim trafią do dashboardów i decyzji biznesowych.' },
              ].map(x => (
                <div key={x.t}>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{x.t}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dane i uprawnienia */}
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px' }}>
          <div style={{ padding: '22px 24px', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', margin: '0 0 12px' }}>
              Dane i uprawnienia
            </h2>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 10px' }}>
              AlertGA4 prosi o jeden zakres dostępu Google —
              tylko do odczytu (<code style={{ fontSize: 12, background: '#eef2f0', padding: '1px 5px', borderRadius: 4 }}>analytics.readonly</code>)
              — żeby móc czytać konfigurację i dane raportowe Twojej usługi GA4. Używamy go wyłącznie do uruchamiania
              skonfigurowanych przez Ciebie sprawdzeń i pokazania wyników — nie mamy możliwości niczego zmienić w Twoim
              koncie Google Analytics.
            </p>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              Pełne informacje: <Link href="/privacy" style={{ color: '#16a34a' }}>Polityka prywatności</Link>{' '}
              i <Link href="/terms" style={{ color: '#16a34a' }}>Regulamin</Link>.
            </p>
          </div>
        </section>

        {/* CTA końcowe */}
        <section style={{ backgroundColor: '#111827', padding: '56px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
            Sprawdź jakość implementacji GA4 już dziś
          </h2>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 24px' }}>
            Logowanie kontem Google zajmuje mniej niż minutę.
          </p>
          <Link href={primaryCta.href} style={{ display: 'inline-block', backgroundColor: '#16a34a', color: '#fff', fontWeight: 600, padding: '13px 26px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
            {primaryCta.label}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
          <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Polityka prywatności</Link>
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Regulamin</Link>
            <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#6b7280', textDecoration: 'none' }}>kontakt@bettersteps.pl</a>
            <a href="https://www.bettersteps.pl" style={{ color: '#6b7280', textDecoration: 'none' }}>www.bettersteps.pl</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
