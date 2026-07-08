import Link from 'next/link'

export const metadata = { title: 'Regulamin — AlertGA4' }

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '32px 0 10px', color: '#111827' }
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', margin: '0 0 12px' }
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#374151', marginBottom: 6 }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Regulamin</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Ostatnia aktualizacja: 8 lipca 2026</p>

        <p style={p}>
          Niniejszy regulamin określa zasady korzystania z AlertGA4 — usługi do monitorowania jakości implementacji
          Google Analytics 4 (GA4), dostępnej pod adresem alertga4.bettersteps.pl. Usługodawcą jest:
        </p>
        <p style={{ ...p, padding: '14px 16px', borderRadius: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <strong>Bettersteps spółka z ograniczoną odpowiedzialnością</strong><br />
          ul. Domaniewska 47, 02-672 Warszawa<br />
          KRS: 0001011888 · NIP: 5214000359 · REGON: 524154200<br />
          E-mail: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>
        </p>
        <p style={p}>Logując się i korzystając z AlertGA4, akceptujesz niniejszy regulamin.</p>

        <h2 style={h2}>1. Opis usługi</h2>
        <p style={p}>
          AlertGA4 łączy się z usługą GA4, do której masz dostęp, wykorzystując dostęp do API Google wyłącznie do
          odczytu, i uruchamia automatyczne sprawdzenia jej konfiguracji oraz danych raportowych, żeby wyliczyć wynik
          jakości, trend i wysyłać alerty e-mail. AlertGA4 nigdy nie zmienia Twojej usługi GA4, jej konfiguracji ani
          danych źródłowych — cały dostęp jest wyłącznie do odczytu.
        </p>

        <h2 style={h2}>2. Konto i dostęp</h2>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>Musisz zalogować się kontem Google, które posiada uprawniony dostęp (co najmniej na poziomie „Viewer”) do każdej dodawanej usługi GA4.</li>
          <li style={li}>Odpowiadasz za projekty, konfigurację i odbiorców alertów skonfigurowanych na swoim koncie.</li>
          <li style={li}>Nie możesz używać AlertGA4 do uzyskiwania ani prób uzyskiwania dostępu do usługi GA4, do której nie jesteś uprawniony.</li>
        </ul>

        <h2 style={h2}>3. Dozwolony sposób korzystania</h2>
        <p style={p}>Zobowiązujesz się, że nie będziesz:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li style={li}>dokonywać inżynierii wstecznej, skanować ani obchodzić mechanizmów kontroli dostępu usługi,</li>
          <li style={li}>wykorzystywać AlertGA4 do przechowywania lub przetwarzania danych, do których nie masz uprawnień,</li>
          <li style={li}>zakłócać dostępności usługi ani nadużywać automatycznych sprawdzeń (np. nadmierne ręczne uruchamianie w celu przeciążenia API Google).</li>
        </ul>

        <h2 style={h2}>4. Dostępność usługi</h2>
        <p style={p}>
          AlertGA4 świadczone jest z dochowaniem należytej staranności. Codzienne automatyczne sprawdzenia i alerty
          e-mail zależą od API Google, naszych dostawców hostingu i poczty oraz utrzymania połączenia z Twoim kontem
          Google — nie gwarantujemy nieprzerwanej dostępności i nie ponosimy odpowiedzialności za pominięte alerty
          wynikające z przyczyn od nas niezależnych.
        </p>

        <h2 style={h2}>5. Brak gwarancji</h2>
        <p style={p}>
          AlertGA4 dostarczane jest w stanie „takim, jaki jest”, bez żadnych gwarancji. Wyniki jakości i sprawdzenia
          mają charakter pomocniczy/informacyjny i nie stanowią gwarancji poprawności ani kompletności danych GA4 —
          za weryfikację własnej implementacji analitycznej odpowiadasz Ty.
        </p>

        <h2 style={h2}>6. Ograniczenie odpowiedzialności</h2>
        <p style={p}>
          W maksymalnym zakresie dopuszczalnym przez prawo, Bettersteps nie ponosi odpowiedzialności za szkody
          pośrednie, uboczne ani następcze wynikające z korzystania lub niemożności korzystania z AlertGA4, w tym za
          decyzje podjęte na podstawie wyników sprawdzeń lub alertów.
        </p>

        <h2 style={h2}>7. Zakończenie korzystania z usługi</h2>
        <p style={p}>
          Możesz zaprzestać korzystania z AlertGA4 i usunąć swoje projekty w dowolnym momencie z poziomu ustawień
          projektu, a dostęp AlertGA4 do konta Google odwołać w{' '}
          <a href="https://myaccount.google.com/permissions" style={{ color: '#16a34a' }}>ustawieniach konta Google</a>{' '}
          w dowolnym momencie. Możemy zawiesić lub zakończyć dostęp kontom naruszającym punkt 3.
        </p>

        <h2 style={h2}>8. Zmiany regulaminu</h2>
        <p style={p}>
          Możemy okresowo aktualizować niniejszy regulamin; w takim przypadku zaktualizujemy datę na górze tej strony.
          Dalsze korzystanie z AlertGA4 po wprowadzeniu zmian oznacza ich akceptację.
        </p>

        <h2 style={h2}>9. Prawo właściwe</h2>
        <p style={p}>Niniejszy regulamin podlega prawu polskiemu.</p>

        <h2 style={h2}>10. Kontakt</h2>
        <p style={p}>
          Pytania dotyczące regulaminu: <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>{' '}
          · <a href="https://www.bettersteps.pl" style={{ color: '#16a34a' }}>www.bettersteps.pl</a>
        </p>

        <p style={{ ...p, marginTop: 24 }}>
          Zobacz też naszą <Link href="/privacy" style={{ color: '#16a34a' }}>Politykę prywatności</Link>.
        </p>
      </main>
    </div>
  )
}
