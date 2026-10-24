import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Polityka prywatności'
const DESCRIPTION = 'Jakie dane zbiera AlertGA4, w jakim celu i jak je przechowuje — pełna polityka prywatności zgodna z RODO.'

// See app/funkcje/page.tsx for why canonical/openGraph/twitter are spelled
// out explicitly here instead of relying on the root layout's defaults.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/privacy',
    languages: { 'pl': '/privacy', 'en': '/en/privacy' },
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/privacy',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} — AlertGA4`,
    description: DESCRIPTION,
  },
}

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6, paddingLeft: 4 }
// Tailwind's Preflight resets list-style to none on every ul/ol, so plain
// <ul>/<ol> tags render as unmarked, indented paragraphs — the "empty"
// look this fixes. Same root cause and fix as the blog articles
// (src/components/marketing/landingStyles.ts's .blog-post-body ul/ol).
const ul: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'disc' }
const ol: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'decimal' }
const link: React.CSSProperties = { color: '#16a34a' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <style>{`.legal-doc li::marker { color: #16a34a; font-weight: 600; }`}</style>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
        <Link href="/en/privacy" hrefLang="en" style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}>English version →</Link>
      </header>

      <main className="legal-doc" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Polityka prywatności</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Ostatnia aktualizacja: 20 października 2026</p>

        <h2 style={h2}>I. Definicje</h2>
        <p style={p}>Pojęcia pisane wielką literą mają znaczenie nadane im w <Link href="/terms" style={link}>Regulaminie Serwisu</Link>, chyba że z treści niniejszej Polityki wynika inaczej.</p>

        <h2 style={h2}>II. Administrator danych</h2>
        <ol style={ol}>
          <li style={li}>Administratorem danych osobowych przetwarzanych w związku z korzystaniem z Serwisu AlertGA4 jest:</li>
        </ol>
        <p style={{ ...p, padding: '14px 16px', borderRadius: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <strong>Bettersteps spółka z ograniczoną odpowiedzialnością</strong><br />
          ul. Domaniewska 47, 02-672 Warszawa<br />
          KRS: 0001011888 · NIP: 5214000359 · REGON: 524154200<br />
          E-mail: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>
        </p>
        <p style={p}>Operator nie powołał formalnie Inspektora Ochrony Danych. We wszystkich sprawach dotyczących ochrony danych osobowych należy kontaktować się bezpośrednio pod adresem <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.</p>

        <h2 style={h2}>III. Jakie dane zbieramy</h2>
        <p style={p}>Logując się kontem Google, otrzymujemy i przechowujemy:</p>
        <ul style={ul}>
          <li style={li}><strong>Podstawowe dane profilu</strong> — imię, nazwisko i adres e-mail, służące do identyfikacji Konta.</li>
          <li style={li}>
            <strong>Token dostępu i token odświeżający OAuth</strong>, w zakresie{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>{' '}
            — dostęp do Google Analytics wyłącznie do odczytu (rola „Viewer”). Nie pozwala to nam zmieniać, usuwać ani eksportować
            surowych danych zdarzeń Twojej usługi GA4 poza zagregowanymi metrykami wyliczanymi przez nasze sprawdzenia.
          </li>
          <li style={li}><strong>Dane usługi GA4, którą wybierzesz do monitorowania</strong> — identyfikatory usługi oraz zagregowane wyniki sprawdzeń (liczby zdarzeń, wynik jakości, status pass/warn/fail).</li>
          <li style={li}><strong>Konfigurację, którą sam wprowadzasz</strong> — nazwy Projektów, zdefiniowane sprawdzenia zdarzeń i parametrów, progi alertów oraz adresy e-mail odbiorców alertów.</li>
          <li style={li}><strong>Dane rozliczeniowe</strong> — w przypadku zakupu Planu Abonamentowego, dane niezbędne do obsługi płatności i wystawienia faktury, przetwarzane w tym zakresie przez Stripe jako niezależnego administratora (dane karty płatniczej nigdy nie trafiają na nasze serwery).</li>
          <li style={li}><strong>Dane techniczne</strong> — adres IP i znaczniki czasu żądań, przetwarzane przez naszych dostawców hostingu (Vercel) w celach bezpieczeństwa, diagnostyki i zapobiegania nadużyciom, zgodnie z ich własnymi politykami retencji.</li>
        </ul>
        <p style={p}>Nie prosimy o żaden inny zakres dostępu do API Google i nigdy nie pytamy o hasło do Twojego konta Google.</p>
        <p style={p}>
          <strong>Dane osób trzecich wskazanych przez Użytkownika.</strong> Jeśli jako odbiorcę alertów dla danego Projektu wskażesz
          adres e-mail innej osoby (np. klienta lub współpracownika), przetwarzamy ten adres wyłącznie w celu wysyłki powiadomień
          dotyczących tego Projektu. Odpowiadasz za posiadanie podstawy prawnej do przekazania nam tego adresu — szczegóły w rozdziale
          VIII <Link href="/terms" style={link}>Regulaminu</Link>.
        </p>

        <h2 style={h2}>IV. Cele i podstawy prawne przetwarzania</h2>
        <p style={p}>Wykorzystujemy powyższe dane wyłącznie do działania Serwisu:</p>
        <ul style={ul}>
          <li style={li}>uruchamiania codziennych i ręcznych sprawdzeń jakości skonfigurowanych dla Twojej usługi GA4;</li>
          <li style={li}>wyliczania wyniku jakości implementacji i prezentowania go w panelu;</li>
          <li style={li}>wysyłki alertów e-mail (do Ciebie oraz, przy alertach per-projekt, na skonfigurowany adres odbiorcy), gdy wynik spadnie poniżej ustalonego progu, oraz codziennego podsumowania zbiorczego;</li>
          <li style={li}>automatycznego odświeżania tokenu dostępu do Google, aby zaplanowane sprawdzenia mogły działać bez konieczności ponownego logowania;</li>
          <li style={li}>obsługi płatności i rozliczeń w ramach wybranego Planu Abonamentowego;</li>
          <li style={li}>obsługi zgłoszeń i reklamacji kierowanych na kontakt@bettersteps.pl.</li>
        </ul>
        <p style={p}>Nie wykorzystujemy Twoich danych do celów reklamowych, nie budujemy na ich podstawie profili behawioralnych i nie sprzedajemy ich.</p>
        <p style={p}>Podstawą prawną przetwarzania jest:</p>
        <ul style={ul}>
          <li style={li}>wykonanie umowy o świadczenie Usługi (art. 6 ust. 1 lit. b RODO) — w zakresie działania Serwisu i rozliczeń;</li>
          <li style={li}>nasz prawnie uzasadniony interes w zapewnieniu bezpieczeństwa, prawidłowego działania Serwisu i dochodzeniu ewentualnych roszczeń (art. 6 ust. 1 lit. f RODO);</li>
          <li style={li}>obowiązek prawny ciążący na Operatorze (art. 6 ust. 1 lit. c RODO) — w zakresie, w jakim przepisy prawa podatkowego i rachunkowego wymagają przechowywania dokumentacji rozliczeniowej.</li>
        </ul>

        <h2 style={h2}>V. Kto ma dostęp do Twoich danych</h2>
        <p style={p}>
          Projekty, ich konfiguracja oraz historia sprawdzeń są prywatne dla konta Google, które je utworzyło. Inni użytkownicy
          AlertGA4 — również zalogowani do aplikacji — nie widzą Twoich Projektów, danych GA4 ani zapisanych tokenów Google. Dostęp
          jest wymuszony na poziomie bazy danych (row-level security), a nie tylko w interfejsie aplikacji.
        </p>
        <p style={p}>
          Jeśli korzystasz z funkcji udostępniania raportu publicznym linkiem (strona /share/[token]), każda osoba posiadająca ten
          link może zobaczyć zawarty w nim raport, bez konieczności logowania. Odpowiadasz za to, komu przekazujesz taki link.
        </p>

        <h2 style={h2}>VI. Podmioty przetwarzające dane w naszym imieniu (podprocesorzy)</h2>
        <p style={p}>Do działania Serwisu korzystamy z następujących podprocesorów, każdy wyłącznie w podanym celu:</p>
        <ul style={ul}>
          <li style={li}><strong>Google</strong> — logowanie (Zaloguj się przez Google) oraz API GA4 (Data/Admin), z których czytamy dane Twojej usługi.</li>
          <li style={li}><strong>Supabase</strong> — dostawca bazy danych i uwierzytelniania; przechowuje Konto, konfigurację Projektów i tokeny OAuth.</li>
          <li style={li}><strong>Vercel</strong> — hosting Serwisu AlertGA4.</li>
          <li style={li}><strong>Resend</strong> — dostarczanie wiadomości e-mail (alerty, podsumowania) wysyłanych przez Serwis.</li>
          <li style={li}><strong>Stripe</strong> — obsługa płatności i rozliczeń dla płatnych Planów Abonamentowych.</li>
        </ul>
        <p style={p}>Żaden z tych dostawców nie jest uprawniony do wykorzystywania Twoich danych na własne potrzeby. O istotnych zmianach tej listy poinformujemy, aktualizując niniejszą Politykę.</p>
        <p style={p}>
          Nasze wykorzystanie i przekazywanie informacji uzyskanych za pośrednictwem Google API jest zgodne z{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" style={link}>Google API Services User Data Policy</a>,
          w tym z wymogami Limited Use: dane odczytane z Twojej usługi GA4 wykorzystujemy wyłącznie do funkcji opisanych w niniejszej
          polityce, nie wykorzystujemy ich do trenowania modeli uczenia maszynowego ani do celów reklamowych, nie sprzedajemy ich ani
          nie udostępniamy nieuprawnionym stronom trzecim, a dostęp do nich mają wyłącznie osoby, którym jest to niezbędne do
          utrzymania usługi.
        </p>
        <p style={{ ...p, fontStyle: 'italic', color: '#6b7280' }}>
          Our use and transfer of information received from Google APIs to any other app will adhere to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" style={link}>Google API Services User Data Policy</a>,
          including the Limited Use requirements.
        </p>

        <h2 style={h2}>VII. Przekazywanie danych poza Europejski Obszar Gospodarczy</h2>
        <p style={p}>
          Część wymienionych wyżej podprocesorów (w tym Vercel, Resend i Stripe) może przetwarzać dane na serwerach zlokalizowanych
          poza Europejskim Obszarem Gospodarczym, w tym w Stanach Zjednoczonych. Podstawą takich transferów są mechanizmy zgodne z
          RODO — w szczególności standardowe klauzule umowne zatwierdzone przez Komisję Europejską (art. 46 ust. 2 lit. c RODO) lub
          decyzje Komisji Europejskiej stwierdzające odpowiedni stopień ochrony danych (art. 45 RODO). Informacje o zastosowanych
          zabezpieczeniach oraz kopię danych przekazywanych do państw trzecich można uzyskać, kontaktując się na{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.
        </p>

        <h2 style={h2}>VIII. Pliki cookies</h2>
        <p style={p}>Serwis wykorzystuje pliki cookies należące do następujących kategorii:</p>
        <ul style={ul}>
          <li style={li}><strong>Niezbędne</strong> — konieczne do działania Serwisu, w szczególności plik cookie utrzymujący sesję zalogowanego Użytkownika (uwierzytelnianie przez Supabase). Bez nich zalogowanie się i korzystanie z Serwisu nie jest możliwe.</li>
          <li style={li}><strong>Analityczne</strong> — służą do mierzenia ruchu i sposobu korzystania z Serwisu, instalowane za pośrednictwem Google Tag Manager.</li>
          <li style={li}><strong>Marketingowe</strong> — wykorzystywane do pomiaru skuteczności działań reklamowych oraz wyświetlania treści dopasowanych do zainteresowań Użytkownika.</li>
          <li style={li}><strong>Funkcjonalne</strong> — zapamiętują wybory i preferencje Użytkownika, w tym jego decyzję w kwestii zgody na pliki cookies.</li>
        </ul>
        <p style={p}>
          Pliki cookies niezbędne, jako konieczne do świadczenia usługi na żądanie Użytkownika, nie wymagają zgody zgodnie z art. 173
          ust. 3 pkt 2 ustawy Prawo telekomunikacyjne. Pliki cookies analityczne, marketingowe i funkcjonalne są instalowane wyłącznie
          po wyrażeniu zgody przez Użytkownika w widocznym przy pierwszej wizycie banerze cookies. Zgodę można w każdej chwili
          wycofać lub zmienić w ustawieniach dostępnych w stopce Serwisu („Ustawienia ciasteczek”) lub bezpośrednio w ustawieniach
          przeglądarki.
        </p>
        <p style={p}>Wyłączenie obsługi plików cookies w przeglądarce uniemożliwi zalogowanie się do Serwisu i korzystanie z niego.</p>

        <h2 style={h2}>IX. Okres przechowywania i usuwanie danych</h2>
        <p style={p}>
          Przechowujemy dane Konta i Projektów tak długo, jak Konto pozostaje aktywne. Usunięcie Projektu natychmiast i trwale
          kasuje jego konfigurację oraz historię sprawdzeń. Dostęp AlertGA4 do konta Google możesz cofnąć w dowolnym momencie w{' '}
          <a href="https://myaccount.google.com/permissions" style={link}>ustawieniach konta Google</a>.
          Aby zażądać całkowitego usunięcia Konta i wszystkich powiązanych danych, napisz na{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>. Dane rozliczeniowe przechowujemy przez
          okres wymagany przepisami prawa podatkowego i rachunkowego.
        </p>
        <p style={p}>Dla danych o ograniczonym, z góry określonym celu stosujemy krótsze, automatyczne okresy przechowywania:</p>
        <ul style={ul}>
          <li style={li}>
            <strong>Historia sprawdzeń i logi wysłanych alertów</strong> — usuwane automatycznie po 40 dniach od wykonania
            sprawdzenia lub wysłania alertu; ten okres obejmuje najdłuższy zakres, z którego korzysta aplikacja (porównania
            trendów i historia widoczna w panelu).
          </li>
          <li style={li}>
            <strong>Zgłoszenia z formularza kontaktowego</strong> (adres IP, wyłącznie w celu ograniczenia nadużyć) — usuwane
            automatycznie po 7 dniach.
          </li>
          <li style={li}>
            <strong>Odpowiedzi z ankiety przy rezygnacji z okresu próbnego</strong> — usuwane automatycznie po 180 dniach.
          </li>
        </ul>

        <h2 style={h2}>X. Twoje prawa</h2>
        <p style={p}>Zgodnie z RODO przysługuje Ci prawo do:</p>
        <ul style={ul}>
          <li style={li}>dostępu do swoich danych oraz otrzymania ich kopii,</li>
          <li style={li}>sprostowania nieprawidłowych danych,</li>
          <li style={li}>usunięcia danych („prawo do bycia zapomnianym”),</li>
          <li style={li}>ograniczenia przetwarzania,</li>
          <li style={li}>przenoszenia danych,</li>
          <li style={li}>wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie,</li>
          <li style={li}>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO).</li>
        </ul>
        <p style={p}>W celu skorzystania z powyższych praw napisz na <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.</p>

        <h2 style={h2}>XI. Bezpieczeństwo</h2>
        <p style={p}>
          Tokeny OAuth i dane Projektów przechowywane są w bazie danych z kontrolą dostępu i nigdy nie są udostępniane w
          przeglądarce poza tym, co niezbędne do wyświetlenia Twoich własnych Projektów. Cały ruch do Serwisu jest szyfrowany
          protokołem HTTPS.
        </p>

        <h2 style={h2}>XII. Dzieci</h2>
        <p style={p}>AlertGA4 jest narzędziem biznesowym i nie jest kierowane do osób poniżej 16 roku życia ani świadomie przez nie wykorzystywane.</p>

        <h2 style={h2}>XIII. Zmiany polityki</h2>
        <p style={p}>
          W przypadku istotnych zmian niniejszej Polityki zaktualizujemy datę na górze tej strony i, w miarę możliwości,
          poinformujemy Użytkowników drogą elektroniczną. Dalsze korzystanie z Serwisu po wprowadzeniu zmian oznacza ich akceptację.
        </p>

        <h2 style={h2}>XIV. Kontakt</h2>
        <p style={p}>
          Pytania dotyczące niniejszej Polityki lub Twoich danych: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={link}>www.bettersteps.pl</a>
        </p>
      </main>
    </div>
  )
}
