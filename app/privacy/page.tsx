import Link from 'next/link'

export const metadata = {
  title: 'Polityka prywatności',
  description: 'Jakie dane zbiera AlertGA4, w jakim celu i jak je przechowuje — pełna polityka prywatności zgodna z RODO.',
}

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6 }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Polityka prywatności</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Ostatnia aktualizacja: 8 lipca 2026</p>

        <h2 style={h2}>1. Administrator danych</h2>
        <p style={p}>
          Administratorem danych osobowych przetwarzanych w ramach usługi AlertGA4 (dostępnej pod adresem
          alertga4.bettersteps.pl) jest:
        </p>
        <p style={{ ...p, padding: '14px 16px', borderRadius: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <strong>Bettersteps spółka z ograniczoną odpowiedzialnością</strong><br />
          ul. Domaniewska 47, 02-672 Warszawa<br />
          KRS: 0001011888 · NIP: 5214000359 · REGON: 524154200<br />
          E-mail: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>
        </p>
        <p style={p}>
          Niniejsza polityka wyjaśnia, jakie dane zbieramy w związku z korzystaniem z AlertGA4, w jakim celu, oraz jak
          są przetwarzane, zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).
        </p>

        <h2 style={h2}>2. Jakie dane zbieramy</h2>
        <p style={p}>Logując się kontem Google, otrzymujemy i przechowujemy:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}><strong>Podstawowe dane profilu</strong> — imię, nazwisko i adres e-mail, służące do identyfikacji konta.</li>
          <li style={li}>
            <strong>Token dostępu i token odświeżający OAuth</strong> w zakresie{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>{' '}
            — czyli dostęp Google Analytics wyłącznie do odczytu, odpowiadający roli „Viewer” w GA4. Pozwala nam to
            czytać konfigurację i dane raportowe Twojej usługi GA4. Nie pozwala to nam zmieniać, usuwać ani eksportować
            surowych danych zdarzeń poza zagregowanymi metrykami wyliczanymi przez nasze sprawdzenia.
          </li>
          <li style={li}>
            <strong>Dane usługi GA4, którą wybierzesz do monitorowania</strong> — identyfikatory usługi oraz zagregowane
            wyniki sprawdzeń (liczby zdarzeń, wyniki, status pass/fail) obliczane na podstawie danych raportowych GA4.
          </li>
          <li style={li}>
            <strong>Konfigurację, którą sam wprowadzasz</strong> — nazwy projektów, zdefiniowane sprawdzenia
            zdarzeń/parametrów, progi alertów oraz adres e-mail klienta, na który chcesz wysyłać alerty.
          </li>
        </ul>
        <p style={p}>Nie prosimy o żaden inny zakres dostępu do API Google i nigdy nie pytamy o hasło do Twojego konta Google.</p>

        <h2 style={h2}>3. W jakim celu przetwarzamy dane</h2>
        <p style={p}>Wykorzystujemy powyższe dane wyłącznie do działania usługi AlertGA4:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Uruchamiania codziennych i ręcznych sprawdzeń jakości skonfigurowanych dla Twojej usługi GA4.</li>
          <li style={li}>Wyliczania wyniku jakości implementacji i pokazywania go w panelu.</li>
          <li style={li}>Wysyłki e-maila (do Ciebie oraz, przy alertach per-projekt, na skonfigurowany adres klienta), gdy wynik projektu spadnie poniżej ustalonego progu, oraz codziennego podsumowania zbiorczego.</li>
          <li style={li}>Automatycznego odświeżania tokenu dostępu do Google, żeby zaplanowane sprawdzenia mogły działać bez konieczności ponownego logowania każdego dnia.</li>
        </ul>
        <p style={p}>Nie wykorzystujemy Twoich danych do celów reklamowych, nie budujemy na ich podstawie profili behawioralnych i nie sprzedajemy ich.</p>
        <p style={p}>
          Podstawą prawną przetwarzania jest wykonanie umowy o świadczenie usługi AlertGA4 (art. 6 ust. 1 lit. b RODO)
          oraz nasz prawnie uzasadniony interes w zapewnieniu bezpieczeństwa i prawidłowego działania usługi (art. 6
          ust. 1 lit. f RODO).
        </p>

        <h2 style={h2}>4. Kto ma dostęp do Twoich danych</h2>
        <p style={p}>
          Projekty, ich konfiguracja oraz historia sprawdzeń są prywatne dla konta Google, które je utworzyło. Inni
          użytkownicy AlertGA4 — również ci zalogowani do aplikacji — nie widzą Twoich projektów, danych GA4 ani
          zapisanych tokenów Google. Dostęp jest wymuszony na poziomie bazy danych (row-level security), a nie tylko
          w interfejsie aplikacji.
        </p>

        <h2 style={h2}>5. Podmioty przetwarzające dane w naszym imieniu</h2>
        <p style={p}>Do działania usługi korzystamy z następujących podprocesorów, każdy wyłącznie w podanym celu:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}><strong>Google</strong> — logowanie (Zaloguj się przez Google) oraz API GA4 (Data/Admin), z których czytamy dane Twojej usługi.</li>
          <li style={li}><strong>Supabase</strong> — dostawca bazy danych i uwierzytelniania; przechowuje konto, konfigurację projektów i tokeny OAuth.</li>
          <li style={li}><strong>Vercel</strong> — hosting aplikacji AlertGA4.</li>
          <li style={li}><strong>Resend</strong> — dostarczanie wiadomości e-mail (alerty, podsumowania) wysyłanych przez AlertGA4.</li>
        </ul>
        <p style={p}>Żaden z tych dostawców nie jest uprawniony do wykorzystywania Twoich danych na własne potrzeby. Dane mogą być przetwarzane na serwerach zlokalizowanych poza Europejskim Obszarem Gospodarczym przez wyżej wymienionych dostawców, w oparciu o mechanizmy zgodne z RODO (m.in. standardowe klauzule umowne).</p>

        <h2 style={h2}>6. Okres przechowywania i usuwanie danych</h2>
        <p style={p}>
          Przechowujemy dane konta i projektów tak długo, jak konto pozostaje aktywne. Usunięcie projektu w AlertGA4
          natychmiast i trwale kasuje jego konfigurację oraz historię sprawdzeń. Dostęp AlertGA4 do konta Google możesz
          cofnąć w dowolnym momencie w{' '}
          <a href="https://myaccount.google.com/permissions" style={{ color: '#16a34a' }}>ustawieniach konta Google</a>.
          Aby zażądać całkowitego usunięcia konta AlertGA4 i wszystkich powiązanych danych, napisz na{' '}
          <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>.
        </p>

        <h2 style={h2}>7. Twoje prawa</h2>
        <p style={p}>Zgodnie z RODO przysługuje Ci prawo do:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>dostępu do swoich danych oraz otrzymania ich kopii,</li>
          <li style={li}>sprostowania nieprawidłowych danych,</li>
          <li style={li}>usunięcia danych („prawo do bycia zapomnianym”),</li>
          <li style={li}>ograniczenia przetwarzania,</li>
          <li style={li}>przenoszenia danych,</li>
          <li style={li}>wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie,</li>
          <li style={li}>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO).</li>
        </ul>
        <p style={p}>W celu skorzystania z powyższych praw napisz na <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>.</p>

        <h2 style={h2}>8. Bezpieczeństwo</h2>
        <p style={p}>
          Tokeny OAuth i dane projektów przechowywane są w bazie danych z kontrolą dostępu i nigdy nie są udostępniane
          w przeglądarce poza tym, co niezbędne do wyświetlenia Twoich własnych projektów. Cały ruch do AlertGA4 jest
          szyfrowany protokołem HTTPS.
        </p>

        <h2 style={h2}>9. Dzieci</h2>
        <p style={p}>AlertGA4 jest narzędziem biznesowym i nie jest kierowane do osób poniżej 16 roku życia ani świadomie przez nie wykorzystywane.</p>

        <h2 style={h2}>10. Zmiany polityki</h2>
        <p style={p}>
          W przypadku istotnych zmian niniejszej polityki zaktualizujemy datę na górze tej strony. Dalsze korzystanie
          z AlertGA4 po wprowadzeniu zmian oznacza ich akceptację.
        </p>

        <h2 style={h2}>11. Kontakt</h2>
        <p style={p}>
          Pytania dotyczące niniejszej polityki lub Twoich danych: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={{ color: '#16a34a' }}>www.bettersteps.pl</a>
        </p>
      </main>
    </div>
  )
}
