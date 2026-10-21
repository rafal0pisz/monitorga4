import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'Regulamin'
const DESCRIPTION = 'Regulamin serwisu AlertGA4 — definicje, zasady rejestracji, plany i rozliczenia, dostępność usługi, odpowiedzialność, reklamacje.'

// See app/funkcje/page.tsx for why canonical/openGraph/twitter are spelled
// out explicitly here instead of relying on the root layout's defaults.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'AlertGA4',
    url: 'https://alertga4.pl/terms',
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
// <ol> tags rendered as unmarked, indented paragraphs — same root cause
// and fix as /privacy and the blog articles. The nested type="a" lists
// need their own lower-alpha variant since an explicit CSS
// list-style-type otherwise overrides the HTML type attribute.
const ol: React.CSSProperties = { paddingLeft: 22, margin: '0 0 12px', listStyleType: 'decimal' }
const olAlpha: React.CSSProperties = { ...ol, listStyleType: 'lower-alpha' }
const link: React.CSSProperties = { color: '#16a34a' }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#111827' }}>
      <style>{`.legal-doc li::marker { color: #16a34a; font-weight: 600; }`}</style>
      <header style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>← AlertGA4</Link>
      </header>

      <main className="legal-doc" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Regulamin</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Ostatnia aktualizacja: 18 października 2026</p>

        <h2 style={h2}>I. Definicje</h2>
        <ol style={ol}>
          <li style={li}><strong>Usługodawca / Operator</strong> — Bettersteps spółka z ograniczoną odpowiedzialnością z siedzibą w Warszawie, ul. Domaniewska 47, 02-672 Warszawa, wpisana do rejestru przedsiębiorców Krajowego Rejestru Sądowego pod numerem KRS: 0001011888, NIP: 5214000359, REGON: 524154200.</li>
          <li style={li}><strong>Serwis</strong> — serwis internetowy AlertGA4 działający pod adresem alertga4.pl, prowadzony przez Operatora.</li>
          <li style={li}><strong>Usługa (Usługi)</strong> — usługa monitorowania jakości implementacji Google Analytics 4 (GA4) świadczona w ramach Serwisu, polegająca na automatycznej i ręcznej weryfikacji konfiguracji oraz danych raportowych wskazanej usługi GA4, wyliczaniu wyniku jakości i wysyłce alertów e-mail.</li>
          <li style={li}><strong>Użytkownik</strong> — osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, której ustawa przyznaje zdolność prawną, korzystająca z Usługi na zasadach niniejszego Regulaminu.</li>
          <li style={li}><strong>Konto</strong> — przestrzeń w Serwisie przypisana do konta Google Użytkownika, wraz z utworzonymi Projektami i ich konfiguracją.</li>
          <li style={li}><strong>Projekt</strong> — pojedyncza usługa GA4 dodana przez Użytkownika do monitorowania, wraz z jej konfiguracją (nazwa, zdefiniowane sprawdzenia, progi alertów, odbiorcy alertów).</li>
          <li style={li}><strong>Okres Próbny</strong> — bezpłatny, jednorazowy okres testowy Konta, wskazany na stronie alertga4.pl/cennik, udostępniany na zasadach planu Agency, bez konieczności podania danych karty płatniczej.</li>
          <li style={li}><strong>Plan Abonamentowy</strong> — wariant odpłatnego korzystania z Konta (Individual, Pro lub Agency), różniący się m.in. limitem liczby monitorowanych usług GA4, opisany szczegółowo na stronie alertga4.pl/cennik.</li>
          <li style={li}><strong>Okres Rozliczeniowy</strong> — miesięczny lub roczny okres, za jaki pobierana jest Opłata Abonamentowa, zgodnie z wyborem Użytkownika przy zakupie Planu Abonamentowego.</li>
          <li style={li}><strong>Opłata Abonamentowa</strong> — opłata z tytułu korzystania z Konta w ramach wybranego Planu Abonamentowego, w wysokości wskazanej w Cenniku.</li>
          <li style={li}><strong>Cennik</strong> — aktualny cennik Usługi dostępny pod adresem alertga4.pl/cennik.</li>
          <li style={li}><strong>Regulamin</strong> — niniejszy regulamin.</li>
        </ol>

        <h2 style={h2}>II. Postanowienia ogólne</h2>
        <ol style={ol}>
          <li style={li}>Regulamin określa zasady korzystania z Serwisu i Usługi oraz prawa i obowiązki Operatora i Użytkownika.</li>
          <li style={li}>Właścicielem Serwisu i podmiotem świadczącym Usługę jest Operator.</li>
          <li style={li}>
            AlertGA4 łączy się z usługą GA4 wskazaną przez Użytkownika wyłącznie w zakresie odczytu (zakres{' '}
            <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>https://www.googleapis.com/auth/analytics.readonly</code>,{' '}
            odpowiadający roli „Viewer” w GA4) i na tej podstawie:
            <ol type="a" style={{ ...olAlpha, marginTop: 6 }}>
              <li style={li}>uruchamia automatyczne (codzienne) oraz ręczne sprawdzenia konfiguracji i danych raportowych Projektu;</li>
              <li style={li}>wylicza na ich podstawie wynik jakości implementacji oraz trend w czasie;</li>
              <li style={li}>wysyła codzienne podsumowanie e-mail z wynikiem i wykrytymi problemami; Użytkownik może w ustawieniach Projektu ograniczyć wysyłkę wyłącznie do dni, w których sprawdzenie wykryło ostrzeżenie lub błąd.</li>
            </ol>
          </li>
          <li style={li}>AlertGA4 nigdy nie modyfikuje, nie usuwa i nie eksportuje surowych danych zdarzeń z usługi GA4 Użytkownika poza zagregowanymi metrykami wyliczanymi na potrzeby własnych sprawdzeń. Dostęp Operatora do usługi GA4 Użytkownika jest wyłącznie do odczytu.</li>
          <li style={li}>Warunkiem korzystania z Serwisu jest zapoznanie się z treścią Regulaminu i jego akceptacja.</li>
          <li style={li}>Operator dokłada starań, aby transmisja danych w ramach Serwisu była bezpieczna; cały ruch do Serwisu jest szyfrowany protokołem HTTPS.</li>
          <li style={li}>Operator nie ponosi odpowiedzialności za problemy wynikające ze sprzętu lub oprogramowania Użytkownika (np. nieaktualna przeglądarka), uniemożliwiające korzystanie z Serwisu.</li>
        </ol>

        <h2 style={h2}>III. Rejestracja i dostęp do konta</h2>
        <ol style={ol}>
          <li style={li}>Dostęp do Serwisu wymaga zalogowania się za pomocą konta Google. Serwis nie oferuje rejestracji loginem i hasłem ani logowania anonimowego.</li>
          <li style={li}>Aby dodać Projekt, Użytkownik musi posiadać uprawnienia co najmniej na poziomie „Viewer” do odpowiedniej usługi GA4 w Google Analytics. Użytkownikowi zabrania się wykorzystywania Serwisu do uzyskiwania lub prób uzyskiwania dostępu do usługi GA4, do której nie posiada uprawnień.</li>
          <li style={li}>Użytkownik odpowiada za konfigurację swoich Projektów, w tym za poprawność adresów e-mail odbiorców alertów, które sam wprowadza.</li>
          <li style={li}>Po pierwszym zalogowaniu Użytkownikowi udostępniany jest jednorazowy, 14-dniowy Okres Próbny na zasadach planu Agency, bez konieczności podania danych karty płatniczej. Po jego zakończeniu dalsze korzystanie z Konta wymaga wykupienia Planu Abonamentowego.</li>
          <li style={li}>Operator zastrzega sobie prawo do zablokowania dostępu do Konta w przypadku uzasadnionego podejrzenia naruszenia Regulaminu, w szczególności podania nieprawdziwych danych lub naruszenia zasad opisanych w rozdziale IV.</li>
        </ol>

        <h2 style={h2}>IV. Zasady korzystania z Serwisu</h2>
        <p style={p}>Użytkownik zobowiązuje się, że nie będzie:</p>
        <ol type="a" style={olAlpha}>
          <li style={li}>podejmować prób inżynierii wstecznej, skanowania ani obchodzenia mechanizmów kontroli dostępu Serwisu;</li>
          <li style={li}>wykorzystywać Serwisu do przetwarzania danych, do których nie posiada uprawnień, w tym cudzych usług GA4;</li>
          <li style={li}>zakłócać dostępności Serwisu ani nadużywać funkcji ręcznego uruchamiania sprawdzeń w sposób nadmiernie obciążający infrastrukturę Operatora lub limity API Google;</li>
          <li style={li}>korzystać z Serwisu w sposób sprzeczny z obowiązującym prawem lub naruszający prawa osób trzecich;</li>
          <li style={li}>udostępniać swojego dostępu do Konta osobom trzecim w sposób sprzeczny z wybranym Planem Abonamentowym.</li>
        </ol>
        <p style={p}>Naruszenie powyższych zasad uprawnia Operatora do zablokowania dostępu do Konta w trybie natychmiastowym, bez zwrotu opłat za niewykorzystany Okres Rozliczeniowy.</p>

        <h2 style={h2}>V. Plany, opłaty i rozliczenia</h2>
        <ol style={ol}>
          <li style={li}>Korzystanie z Serwisu po zakończeniu Okresu Próbnego jest odpłatne, zgodnie z wybranym Planem Abonamentowym (Individual, Pro lub Agency), różniącym się limitem liczby monitorowanych Projektów. Aktualne limity i ceny wskazane są w Cenniku.</li>
          <li style={li}>Opłaty rozliczane są miesięcznie lub rocznie, zgodnie z wyborem Użytkownika, z góry za dany Okres Rozliczeniowy.</li>
          <li style={li}>Obsługę płatności zapewnia Stripe. Dokonując płatności kartą, Użytkownik wyraża zgodę na automatyczne odnawianie subskrypcji i pobieranie Opłaty Abonamentowej za kolejne Okresy Rozliczeniowe, do czasu anulowania subskrypcji.</li>
          <li style={li}>Użytkownik zarządza swoją subskrypcją samodzielnie — zmiana Planu Abonamentowego, zmiana metody płatności oraz anulowanie subskrypcji odbywają się przez panel zarządzania płatnościami (Stripe Customer Portal), dostępny z poziomu ustawień Konta.</li>
          <li style={li}>Anulowanie subskrypcji skutkuje zaprzestaniem pobierania opłat od kolejnego Okresu Rozliczeniowego; do końca opłaconego Okresu Rozliczeniowego Konto zachowuje dotychczasowy Plan Abonamentowy. Użytkownikowi nie przysługuje zwrot opłaty za niewykorzystaną część Okresu Rozliczeniowego.</li>
          <li style={li}>O zmianach w Cenniku Operator poinformuje z wyprzedzeniem drogą elektroniczną; zmiany obowiązują od kolejnego Okresu Rozliczeniowego. Brak rezygnacji z Usługi w terminie 14 dni od otrzymania informacji o zmianie cen uznaje się za jej akceptację.</li>
        </ol>

        <h2 style={h2}>VI. Dostępność usługi i przerwy techniczne</h2>
        <ol style={ol}>
          <li style={li}>Operator dokłada należytej staranności, aby Serwis działał nieprzerwanie, jednak nie gwarantuje nieprzerwanej dostępności. Codzienne automatyczne sprawdzenia i alerty e-mail zależą od dostępności API Google oraz dostawców infrastruktury Operatora (hosting, baza danych, dostarczanie poczty e-mail).</li>
          <li style={li}>Operator zastrzega sobie prawo do czasowych przerw technicznych w działaniu Serwisu, w szczególności w celu konserwacji lub aktualizacji. Operator dokłada starań, aby takie przerwy były możliwie krótkie.</li>
          <li style={li}>Operator nie ponosi odpowiedzialności za niewykonanie lub nienależyte wykonanie Usługi z przyczyn leżących po stronie podmiotów trzecich (w tym Google, dostawców hostingu, poczty elektronicznej i operatorów telekomunikacyjnych) lub wynikających z działania siły wyższej.</li>
        </ol>

        <h2 style={h2}>VII. Brak gwarancji i odpowiedzialność</h2>
        <ol style={ol}>
          <li style={li}>Serwis dostarczany jest w stanie „takim, jaki jest”. Wyniki sprawdzeń, wynik jakości i alerty mają charakter pomocniczy i informacyjny — nie stanowią gwarancji poprawności ani kompletności danych GA4 Użytkownika. Za weryfikację własnej implementacji analitycznej odpowiada Użytkownik.</li>
          <li style={li}>W maksymalnym zakresie dopuszczalnym przez prawo Operator nie ponosi odpowiedzialności za szkody pośrednie, uboczne lub następcze wynikające z korzystania lub niemożności korzystania z Serwisu, w tym za decyzje biznesowe podjęte na podstawie wyników sprawdzeń lub otrzymanych alertów (lub ich braku).</li>
          <li style={li}>Powyższe ograniczenia nie wyłączają odpowiedzialności Operatora w zakresie, w jakim nie może ona zostać ograniczona lub wyłączona na mocy bezwzględnie obowiązujących przepisów prawa, w szczególności wobec Użytkowników będących konsumentami.</li>
        </ol>

        <h2 style={h2}>VIII. Powierzenie przetwarzania danych osobowych</h2>
        <ol style={ol}>
          <li style={li}>W zakresie, w jakim w ramach korzystania z Serwisu Użytkownik przekazuje Operatorowi dane osobowe osób trzecich (np. adresy e-mail odbiorców alertów innych niż sam Użytkownik), Użytkownik powierza Operatorowi przetwarzanie tych danych wyłącznie w celu świadczenia Usługi — wysyłki powiadomień alertowych na wskazany adres.</li>
          <li style={li}>Użytkownik oświadcza, że posiada podstawę prawną do przekazania Operatorowi takich danych oraz że są one aktualne i prawidłowe.</li>
          <li style={li}>Operator przetwarza powierzone dane wyłącznie na udokumentowane polecenie Użytkownika wynikające z korzystania z Serwisu, stosuje odpowiednie środki techniczne i organizacyjne oraz korzysta z podprocesorów wymienionych w Polityce prywatności, informując o istotnych zmianach tej listy.</li>
          <li style={li}>Szczegółowe zasady przetwarzania danych osobowych, w tym kategorie danych, cele, podstawy prawne i okresy przechowywania, opisane są w <Link href="/privacy" style={link}>Polityce prywatności</Link>.</li>
        </ol>

        <h2 style={h2}>IX. Reklamacje</h2>
        <ol style={ol}>
          <li style={li}>Reklamacje dotyczące działania Serwisu należy zgłaszać na adres <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>, z dopiskiem „Reklamacja”, podając: dane identyfikujące Użytkownika (imię i nazwisko lub nazwę firmy), adres e-mail przypisany do Konta oraz opis i przyczynę reklamacji.</li>
          <li style={li}>Operator rozpatruje reklamację w terminie 14 dni od jej otrzymania i informuje Użytkownika o sposobie jej rozpatrzenia drogą elektroniczną. Jeżeli zgłoszenie wymaga uzupełnienia, termin ten liczy się od dnia otrzymania uzupełnienia.</li>
          <li style={li}>
            Użytkownik będący konsumentem może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń za pośrednictwem{' '}
            <a href="https://ec.europa.eu/consumers/odr" style={link}>Platformy ODR Komisji Europejskiej</a>{' '}
            lub Rzecznika Finansowego/UOKiK, zgodnie z zasadami opisanymi na stronie{' '}
            <a href="https://polubowne.uokik.gov.pl/" style={link}>polubowne.uokik.gov.pl</a>.
          </li>
        </ol>

        <h2 style={h2}>X. Zakończenie korzystania z usługi i eksport danych</h2>
        <ol style={ol}>
          <li style={li}>Użytkownik może w każdej chwili usunąć Projekt z poziomu jego ustawień — usunięcie jest natychmiastowe i trwałe (konfiguracja i historia sprawdzeń danego Projektu zostają skasowane).</li>
          <li style={li}>
            Użytkownik może w każdej chwili cofnąć dostęp AlertGA4 do swojego konta Google w{' '}
            <a href="https://myaccount.google.com/permissions" style={link}>ustawieniach konta Google</a>{' '}
            oraz zrezygnować z subskrypcji przez panel zarządzania płatnościami.
          </li>
          <li style={li}>Aby zażądać całkowitego usunięcia Konta i wszystkich powiązanych danych, należy napisać na <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>. Operator usunie dane niezwłocznie, z zastrzeżeniem okresu niezbędnego do wykazania prawidłowości rozliczeń (np. dla celów podatkowo-księgowych).</li>
          <li style={li}>Operator może zawiesić lub zakończyć dostęp do Konta naruszającego postanowienia rozdziału IV, bez obowiązku zwrotu opłat za niewykorzystany Okres Rozliczeniowy.</li>
        </ol>

        <h2 style={h2}>XI. Własność intelektualna</h2>
        <p style={p}>
          Serwis, jego nazwa, logotyp, elementy graficzne, kod źródłowy oraz układ prezentowanych treści stanowią przedmiot praw wyłącznych Operatora lub podmiotów, z którymi Operator zawarł stosowne umowy licencyjne, i podlegają ochronie prawnej. Korzystanie z Serwisu nie oznacza przeniesienia jakichkolwiek praw własności intelektualnej na Użytkownika.
        </p>

        <h2 style={h2}>XII. Postanowienia końcowe</h2>
        <ol style={ol}>
          <li style={li}>Operator ma prawo zmienić Regulamin z ważnej przyczyny, w szczególności w razie zmiany funkcjonalności Serwisu, zmiany przepisów prawa lub poprawy jakości obsługi Użytkowników. O zmianach Operator poinformuje drogą elektroniczną i publikując nową treść Regulaminu na stronie Serwisu z aktualną datą.</li>
          <li style={li}>Dalsze korzystanie z Serwisu po wejściu w życie zmian oznacza ich akceptację. Użytkownik, który nie akceptuje zmian, może zrezygnować z korzystania z Serwisu przed ich wejściem w życie.</li>
          <li style={li}>W sprawach nieuregulowanych Regulaminem stosuje się przepisy prawa polskiego.</li>
          <li style={li}>Wszelkie spory wynikające z korzystania z Serwisu rozstrzygane będą przez sąd właściwy według obowiązujących przepisów; w przypadku Użytkowników niebędących konsumentami — przez sąd właściwy dla siedziby Operatora.</li>
          <li style={li}>Regulamin dostępny jest nieodpłatnie pod adresem alertga4.pl/terms.</li>
          <li style={li}>Pytania dotyczące Regulaminu: <a href="mailto:kontakt@bettersteps.pl" style={link}>kontakt@bettersteps.pl</a>.</li>
        </ol>

        <p style={{ ...p, marginTop: 24 }}>
          Zobacz też naszą <Link href="/privacy" style={link}>Politykę prywatności</Link>.
        </p>
      </main>
    </div>
  )
}
