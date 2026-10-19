// Blog content store. Kept as a plain in-repo array for now — no CMS yet —
// each post's body is pre-rendered HTML (not Markdown: no markdown
// dependency in this project), written by hand to match the rest of the
// marketing site's tone. `status: 'coming-soon'` posts show as a teaser
// card with no link and no body; promote one to 'published' with a
// `bodyHtml` and `publishedAt` once its article is actually written.
export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  targetPhrase: string
  status: 'published' | 'coming-soon'
  publishedAt?: string // ISO date (YYYY-MM-DD)
  bodyHtml?: string
  faqHtml?: string // rendered after the trial banner, kept separate so the banner sits above the FAQ
}

const ALERTS_BODY_HTML = `
  <p>Firmy często zakładają, że skoro GA4 zbiera dane o ruchu i konwersjach, samo też da znać, gdy coś w tych danych zacznie się psuć. GA4 rzeczywiście ma do tego mechanizm: Insights. Ten artykuł pokazuje, czym on jest, jak go skonfigurować, gdzie kończą się jego możliwości i czym różni się od codziennego, zautomatyzowanego monitoringu takiego jak AlertGA4.</p>

  <h2>Czym są alerty w Google Analytics 4</h2>

  <p>Universal Analytics, poprzednik GA4, miał funkcję Custom Alerts: definiowało się próg dla wybranej metryki, a system wysyłał maila, gdy został przekroczony. GA4 nie ma funkcji o tej samej nazwie ani działającej w ten sam sposób. Zamiast tego ma panel Insights, dostępny pod ikoną dzwonka w prawym górnym rogu każdego raportu.</p>

  <p>Insights dzielą się na dwa rodzaje. Pierwszy to insighty automatyczne, które GA4 generuje samodzielnie na podstawie własnych modeli statystycznych analizujących dane konta na bieżąco. Taki insight może na przykład zgłosić nagły wzrost liczby sesji z konkretnego kraju albo spadek konwersji w jednym kanale, bez żadnej konfiguracji z Twojej strony.</p>

  <p>Drugi rodzaj to insighty niestandardowe, nazywane Custom Insights. Definiuje się je samodzielnie: wybiera się metrykę do obserwacji, opcjonalny wymiar, warunek uruchomienia (na przykład spadek o więcej niż 20 procent względem poprzedniego tygodnia) oraz częstotliwość sprawdzania.</p>

  <p>W obu przypadkach powiadomienie trafia do panelu Insights w interfejsie GA4, a część insightów GA4 wysyła też mailem. Różnica wobec dedykowanego monitoringu jakości danych nie leży więc w tym, czy mail w ogóle istnieje, tylko w tym, czego dotyczy: insight operuje na ogólnych metrykach, takich jak sesje, użytkownicy czy konwersje, i nie zejdzie do poziomu konkretnego zdarzenia, parametru czy transakcji.</p>

  <p>Ta różnica wynika z tego, jak Google przebudował całą analitykę przy przejściu z Universal Analytics na GA4. Universal Analytics była zbudowana wokół sesji i stron, a Custom Alerts działały na prostych, zdefiniowanych przez użytkownika progach liczbowych. GA4 jest zbudowana wokół zdarzeń i modeli uczenia maszynowego, więc Google zastąpił proste progi mechanizmem opartym na wykrywaniu anomalii statystycznych. To rozwiązanie bywa trafniejsze przy naprawdę nietypowych zmianach, ale gorzej radzi sobie z pilnowaniem konkretnych, z góry znanych reguł biznesowych, dokładnie takich, jakich oczekiwały stare Custom Alerts.</p>

  <h2>Jak używać alertów w GA4</h2>

  <ol>
    <li>Otwórz dowolny raport w GA4 i kliknij ikonę dzwonka w prawym górnym rogu. Pojawi się panel Insights z listą już wygenerowanych, automatycznych obserwacji.</li>
    <li>Przejrzyj automatyczne insighty. Każdy opisuje jedną zaobserwowaną zmianę razem z wielkością odchylenia od typowego zakresu dla tej metryki.</li>
    <li>Żeby dodać własną regułę, kliknij przycisk tworzenia nowego insightu w tym samym panelu.</li>
    <li>Wybierz metrykę do obserwacji, na przykład sesje, przychód albo liczbę konwersji, i opcjonalnie wymiar, po którym ma być liczona: kraj, kanał, urządzenie czy kampania.</li>
    <li>Ustaw warunek uruchomienia: wzrost lub spadek o określoną wartość procentową albo bezwzględną, względem wybranego okresu porównawczego.</li>
    <li>Wybierz częstotliwość sprawdzania, zwykle dziennie albo co tydzień, i zapisz regułę.</li>
    <li>GA4 będzie sprawdzać regułę cyklicznie i zgłaszać dopasowania w panelu Insights, bez dodatkowego działania z Twojej strony.</li>
  </ol>

  <p>Dla kont połączonych z Google Ads część insightów dotyczących ruchu płatnego może pojawiać się dodatkowo w interfejsie kampanii, niezależnie od panelu GA4.</p>

  <p>W praktyce najwięcej korzyści daje połączenie kilku automatycznych insightów z garstką własnych reguł na najważniejszych dla Ciebie metrykach: przychodzie, liczbie leadów, kluczowych kanałach pozyskania. Im więcej reguł próbujesz utrzymać ręcznie, tym łatwiej o to, że któraś przestanie być aktualna po zmianie w ofercie czy kampanii, a nikt tego nie zauważy.</p>

  <p>Przykładowo, sklep internetowy może ustawić insight pilnujący spadku przychodu o więcej niż 15 procent dzień do dnia oraz drugi, pilnujący wzrostu współczynnika porzuceń koszyka o więcej niż 10 punktów procentowych tydzień do tygodnia. Oba sprawdzą się dobrze, dopóki ktoś pamięta, że istnieją, i regularnie zagląda do panelu Insights, żeby zobaczyć, czy któryś się nie uruchomił.</p>

  <h2>Jakie są ograniczenia alertów w GA4</h2>

  <p>Insights to realne, działające narzędzie, ale ma kilka ograniczeń, które warto znać, zanim założysz, że w pełni pokrywa monitoring jakości danych.</p>

  <ul>
    <li><b>Insight pokazuje ogólną metrykę, nie konkretne zdarzenie czy parametr.</b> Mail o insightcie poinformuje na przykład o spadku sesji, użytkowników czy konwersji, ale nie powie, czy przyczyną jest self-referral, zdublowany zakup, ruch botowy w nocy czy brakujący parametr przy zdarzeniu zakupu. To największa różnica względem checków zbudowanych pod konkretne, znane problemy pomiarowe — oba mechanizmy wysyłają maila, ale na zupełnie innym poziomie szczegółowości.</li>
    <li><b>Reguły trzeba wymyślić samemu.</b> GA4 nie ma gotowych, predefiniowanych checków pod konkretne, znane problemy pomiarowe: self-referral, zdublowane zdarzenie zakupu, ruch botowy w nocy, udział „(not set)” w źródle ruchu. Żeby złapać taki problem insightem, trzeba najpierw wiedzieć, że w ogóle może wystąpić, i samodzielnie ułożyć pod niego regułę na jednej z dostępnych, ogólnych metryk.</li>
    <li><b>Mailowe powiadomienia działają w ograniczonym zakresie.</b> Insighty widać przede wszystkim w panelu w interfejsie GA4. Powiadomienie mailem jest dostępne, ale nie dla każdego typu insightu i nie tak niezawodnie, jak kiedyś działały Custom Alerts w Universal Analytics.</li>
    <li><b>Liczba własnych insightów na usługę jest ograniczona.</b> Nie da się monitorować nieograniczonej liczby reguł jednocześnie na jednej usłudze GA4, więc trzeba wybierać, co jest najważniejsze.</li>
    <li><b>Każda usługa ma osobny panel.</b> Przy kilku czy kilkudziesięciu klientach, typowych dla agencji, oznacza to wchodzenie do każdej usługi GA4 z osobna, bez jednego zbiorczego widoku wszystkich kont naraz.</li>
    <li><b>Insights nie obejmują pokrycia parametrów ani zdarzeń e-commerce.</b> Mechanizm operuje na gotowych, ogólnych metrykach GA4 i nie sprawdzi, czy parametr <i>currency</i> dociera razem ze zdarzeniem <i>purchase</i>, albo czy w lejku e-commerce nie brakuje zdarzenia <i>begin_checkout</i>.</li>
    <li><b>Powiadomienie widzi tylko osoba zalogowana na danym koncie Google.</b> Insights nie mają wbudowanego sposobu na rozesłanie informacji do całego zespołu czy do klienta, dla którego prowadzisz konto. Żeby ktoś inny się dowiedział, trzeba mu to ręcznie przekazać.</li>
  </ul>

  <p>Żadne z tych ograniczeń nie czyni Insights bezużytecznym — to wciąż realne alerty, które potrafią trafić na maila. Problem pojawia się wtedy, gdy firma traktuje ten ogólny poziom jako kompletny system monitoringu i przestaje szukać czegoś, co zejdzie do konkretnych zdarzeń i parametrów, mimo że właśnie tam kryje się większość realnych, kosztownych błędów pomiarowych w GA4.</p>

  <h2>AlertGA4: zaawansowane alerty zbudowane pod konkretne problemy GA4</h2>

  <p>AlertGA4 nie zastępuje Insights w GA4. Uzupełnia dokładnie te miejsca, w których wbudowany mechanizm się kończy.</p>

  <p>Zamiast samodzielnie wymyślać reguły statystyczne, po podłączeniu usługi GA4 dostajesz od razu komplet gotowych checków zbudowanych pod realne, znane problemy pomiarowe:</p>

  <ul>
    <li>self-referral i utrata atrybucji kanałów,</li>
    <li>duplikaty zdarzenia zakupu zawyżające przychód,</li>
    <li>ruch botowy w nocnych godzinach,</li>
    <li>udział „(not set)” w źródle, medium i stronie lądowania,</li>
    <li>anomalie geograficzne i nietypowy ruch z nowych krajów,</li>
    <li>pokrycie parametrów standardowych i niestandardowych,</li>
    <li>kompletność zdarzeń niestandardowych i e-commerce.</li>
  </ul>

  <p>Każda monitorowana usługa jest sprawdzana automatycznie, raz dziennie, bez ręcznego wchodzenia do żadnego panelu. Wynik każdego checka trafia na dashboard z ogólnym wynikiem jakości danych dla danej usługi oraz trendem względem poprzednich dni.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-dashboard.png" alt="Dashboard AlertGA4 z listą monitorowanych projektów i ich wynikami jakości danych" width="1280" height="900" loading="lazy" />
    <figcaption>Dashboard AlertGA4: wszystkie monitorowane usługi GA4 z aktualnym wynikiem i trendem w jednym miejscu.</figcaption>
  </figure>

  <p>Gdy któryś check wykryje problem, dostajesz maila z konkretną diagnozą: który dokładnie wskaźnik nie przeszedł, jaką ma wartość i jak zmieniła się względem poprzedniego okresu. To jest różnica wobec samego insightu: zamiast „coś się zmieniło”, dostajesz informację w stylu „self-referral wzrósł do 3,2 procent sesji, z 0,3 procent tydzień wcześniej”.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-checks.png" alt="Widok checków AlertGA4 dla konkretnego projektu, z wynikami Pass, Warn i Fail" width="1280" height="900" loading="lazy" />
    <figcaption>Widok checków dla pojedynczego projektu: każdy wskaźnik z wartością, zmianą względem poprzedniego okresu i statusem.</figcaption>
  </figure>

  <p>Dodatkowo można skonfigurować osobny, krytyczny kanał alertów: wskazuje się konkretne metryki i osobny adres mailowy, który dostanie powiadomienie wyłącznie wtedy, gdy akurat one pokażą problem, niezależnie od ogólnego wyniku całego projektu.</p>

  <p>Dla kont obsługujących wiele usług GA4, typowych dla agencji, AlertGA4 pokazuje wszystkie monitorowane projekty na jednym dashboardzie, z aktualnym wynikiem i trendem przy każdym z nich, zamiast wchodzenia do każdej usługi osobno. Zespół można zaprosić do wspólnej pracy nad kontem bez współdzielenia haseł.</p>

  <p>Jeśli nie chcesz codziennego maila, możesz włączyć opcję wysyłki tylko wtedy, gdy danego dnia faktycznie pojawi się ostrzeżenie lub błąd, zamiast dostawać wiadomość każdego dnia niezależnie od wyniku.</p>

  <p>Konfiguracja nowego projektu nie wymaga ręcznego wpisywania nazw zdarzeń czy parametrów. Kreator czyta rzeczywiste dane z podłączonej usługi GA4 i podpowiada, które zdarzenia i parametry warto monitorować, razem z ich wolumenem z ostatnich 30 dni. Poza codziennym, automatycznym sprawdzaniem dostępny jest też ręczny przycisk „Uruchom teraz”, przydatny zaraz po naprawieniu jakiegoś problemu, gdy nie chcesz czekać do następnego dnia na potwierdzenie, że rzeczywiście zniknął.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <p>Różnica między samym Insights a pełnym monitoringiem jakości danych nie jest tylko teoretyczna. W praktyce najbardziej odczuwają ją trzy grupy.</p>

  <ul>
    <li><b>Sklepy internetowe</b>, dla których zduplikowany event zakupu albo zepsuty lejek e-commerce bezpośrednio zniekształca raportowany przychód i ocenę skuteczności kampanii reklamowych.</li>
    <li><b>Agencje marketingowe i analityczne</b>, które odpowiadają za kilka lub kilkadziesiąt kont GA4 naraz i nie mają czasu, żeby codziennie przeglądać panel Insights osobno w każdej z nich.</li>
    <li><b>Zespoły wewnętrzne bez dedykowanego analityka</b>, dla których insight w stylu „sesje spadły o 24 procent” nie niesie żadnej konkretnej wskazówki, co dalej zrobić.</li>
  </ul>

  <h2>Porównanie: Insights w GA4 a AlertGA4</h2>

  <p>Insights w GA4 to realne alerty, które mogą trafiać także na maila — to nie jest fikcyjna funkcja. Różnica wobec AlertGA4 nie leży więc w tym, czy powiadomienie w ogóle istnieje, tylko na jakim poziomie szczegółowości działa: GA4 informuje o ogólnych statystykach, takich jak sesje, użytkownicy czy konwersje, a AlertGA4 schodzi do konkretnych zdarzeń, parametrów i transakcji.</p>

  <table class="blog-table">
    <tr><th>Cecha</th><th>Insights w GA4</th><th>AlertGA4</th></tr>
    <tr><td>Czy to w ogóle alert mailowy</td><td>Tak, ale tylko dla części insightów i w ograniczonym zakresie</td><td>Tak, codziennie lub tylko przy problemie</td></tr>
    <tr><td>Poziom szczegółowości</td><td>Ogólne statystyki: sesje, użytkownicy, konwersje</td><td>Konkretne zdarzenia i parametry: self-referral, duplikaty zakupu, „(not set)”, pokrycie parametrów</td></tr>
    <tr><td>Gotowe reguły pod znane problemy (self-referral, duplikaty, boty, „(not set)”)</td><td>Nie, trzeba samodzielnie zdefiniować regułę na ogólnej metryce</td><td>Tak, od razu po podłączeniu usługi</td></tr>
    <tr><td>Sprawdzanie pokrycia parametrów i zdarzeń e-commerce</td><td>Nie</td><td>Tak</td></tr>
    <tr><td>Widok wielu usług i klientów w jednym miejscu</td><td>Nie, każda usługa osobno</td><td>Tak, jeden dashboard</td></tr>
    <tr><td>Osobny alert dla wybranych, krytycznych metryk</td><td>Tak, ale na poziomie ogólnej metryki</td><td>Tak, na poziomie konkretnego checka</td></tr>
    <tr><td>Czas potrzebny na skonfigurowanie pierwszego alertu</td><td>Trzeba samodzielnie dobrać metrykę, próg i częstotliwość</td><td>Kreator podpowiada na podstawie realnych danych z usługi</td></tr>
    <tr><td>Koszt</td><td>Wliczone w GA4, bezpłatne</td><td>Płatny abonament, od planu Individual</td></tr>
  </table>

  <h2>Jak połączyć oba rozwiązania</h2>

  <p>Insights w GA4 i AlertGA4 nie wykluczają się nawzajem. Najwięcej daje używanie ich razem.</p>

  <ol>
    <li>Zostaw włączone automatyczne insighty w GA4 jako ogólny, darmowy mechanizm wykrywania nietypowych zmian w dowolnej metryce.</li>
    <li>Podłącz usługę GA4 do AlertGA4, żeby codziennie sprawdzać konkretne, znane źródła błędów pomiarowych, których Insights nie obejmuje.</li>
    <li>Skonfiguruj adres do codziennego alertu oraz, jeśli to potrzebne, osobny krytyczny kanał dla wybranych metryk.</li>
    <li>Raz na jakiś czas przejrzyj również panel Insights w GA4, zwłaszcza po większych zmianach w kampaniach, ofercie albo na stronie.</li>
  </ol>
`

const ALERTS_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy AlertGA4 zastępuje Insights w GA4?</summary>
      <div class="blog-faq-answer"><p>Nie, i nie taki jest cel. Insights w GA4 to ogólny mechanizm wykrywania anomalii statystycznych, dostępny za darmo w samym GA4. AlertGA4 dokłada warstwę gotowych, konkretnych checków pod znane problemy pomiarowe, których Insights nie obejmuje, oraz codzienną, pewną wysyłkę mailową z diagnozą.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy warto korzystać z obu naraz?</summary>
      <div class="blog-faq-answer"><p>Tak. Insights w GA4 wciąż ma sens jako ogólny, darmowy mechanizm wykrywania nietypowych zmian w dowolnej metryce, którą sam zdefiniujesz. AlertGA4 pilnuje w tle konkretnych, znanych źródeł błędów pomiarowych, które łatwo przeoczyć, patrząc tylko na ogólne metryki.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy trzeba znać się na statystyce, żeby skonfigurować alerty w GA4?</summary>
      <div class="blog-faq-answer"><p>Przy Custom Insights w GA4 tak, trzeba samodzielnie dobrać metrykę, próg i częstotliwość. W AlertGA4 checki są już zdefiniowane, a kreator konfiguracji podpowiada na podstawie realnych danych z Twojej usługi, co warto dodatkowo monitorować.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Ile czasu zajmuje wdrożenie AlertGA4?</summary>
      <div class="blog-faq-answer"><p>Podłączenie jednej usługi GA4 i przejście przez kreator konfiguracji zajmuje zwykle kilkanaście minut. Codzienne sprawdzanie i wysyłka alertów działają od razu po zapisaniu konfiguracji, bez dalszej pracy z Twojej strony.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Co jeśli obsługuję kilkanaście usług GA4 dla różnych klientów?</summary>
      <div class="blog-faq-answer"><p>Plan Agency pozwala monitorować do stu usług GA4 z jednego konta, z jednym dashboardem pokazującym wszystkie projekty naraz, oraz z możliwością zaproszenia zespołu do wspólnej pracy bez współdzielenia haseł.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy AlertGA4 wymaga zmian w kodzie strony albo w konfiguracji GA4?</summary>
      <div class="blog-faq-answer"><p>Nie. Podłączenie usługi odbywa się przez standardowe logowanie Google i nadanie dostępu do odczytu danych GA4. AlertGA4 tylko czyta dane, które GA4 już zbiera, i nic nie zmienia w samej konfiguracji usługi ani w kodzie śledzącym na stronie.</p></div>
    </details>
  </div>
`

const DUPLICATE_PURCHASE_BODY_HTML = `
  <p>Przychód w GA4 to jedna z metryk, na które patrzy się najczęściej i którym ufa się najmniej krytycznie — w końcu to GA4 ma po prostu zliczyć to, co faktycznie się sprzedało. Problem w tym, że event <i>purchase</i> potrafi wystrzelić więcej niż raz dla tej samej transakcji, a GA4 domyślnie nie ma jak tego samodzielnie wykryć. Efekt: przychód, ROAS i liczba zamówień w raportach GA4 są wyższe niż w rzeczywistości, często o kilka do kilkunastu procent, bez żadnego ostrzeżenia w interfejsie.</p>

  <h2>Czym jest zduplikowany zakup w GA4</h2>

  <p>Zduplikowany zakup to sytuacja, w której zdarzenie <i>purchase</i> z tymi samymi (albo bardzo podobnymi) danymi transakcji zostaje wysłane do GA4 więcej niż raz. GA4 nie ma wbudowanego mechanizmu, który automatycznie rozpozna dwa zdarzenia jako „tę samą transakcję” — chyba że parametr <i>transaction_id</i> jest ustawiony i spójny, a nawet wtedy GA4 i tak zlicza oba wystąpienia zdarzenia osobno w większości standardowych raportów, nie prowadząc pełnej deduplikacji po stronie interfejsu.</p>

  <p>W praktyce duplikat oznacza, że jedno realne zamówienie o wartości, powiedzmy, 250 zł, w GA4 wygląda jak dwa zamówienia po 250 zł — 500 zł pseudo-przychodu z jednej transakcji klienta.</p>

  <h2>Najczęstsze przyczyny duplikatu</h2>

  <ol>
    <li><b>Odświeżenie strony potwierdzenia zamówienia.</b> Jeśli tag <i>purchase</i> jest podpięty do zdarzenia Page View na stronie „Dziękujemy za zamówienie”, każde odświeżenie tej strony przez klienta (albo powrót do niej przyciskiem wstecz, a potem ponownie do przodu) wysyła zdarzenie jeszcze raz.</li>
    <li><b>Tag wysyłany zarówno przez GTM w przeglądarce, jak i przez integrację server-side.</b> Część sklepów wdraża jednocześnie tag w kontenerze webowym GTM i osobną integrację server-side (np. z platformy e-commerce) wysyłającą to samo zdarzenie purchase do GA4, bez wzajemnej koordynacji.</li>
    <li><b>Dwa triggery w tym samym kontenerze GTM odpalające ten sam tag.</b> Typowy błąd konfiguracyjny: tag purchase ma ustawiony zarówno trigger „Custom Event” nasłuchujący zdarzenia z dataLayer, jak i dodatkowy trigger „Page View” na tej samej stronie, więc odpala się dwa razy przy jednym załadowaniu.</li>
    <li><b>Brak unikalnego i stabilnego <i>transaction_id</i>.</b> Gdy identyfikator transakcji nie jest ustawiany wcale albo zmienia się między wywołaniami tego samego zamówienia, GA4 nie ma żadnego klucza, po którym dałoby się rozpoznać duplikat nawet ręcznie w raportach.</li>
    <li><b>Aplikacje jednostronicowe (SPA) z błędną obsługą routingu.</b> Jeśli zmiana widoku po złożeniu zamówienia wywołuje dataLayer.push z eventem purchase przy każdym re-renderze komponentu potwierdzenia, a nie tylko raz po stronie backendu, duplikaty pojawiają się praktycznie przy każdej transakcji.</li>
    <li><b>Integracje marketingowe podpięte pod ten sam dataLayer.push.</b> Czasem to nie sam tag GA4 się duplikuje, tylko skrypt zewnętrzny (np. recenzji produktowych albo programu lojalnościowego) wywołuje ponownie całe zdarzenie dataLayer purchase, które GTM odbiera i przekazuje dalej do GA4.</li>
  </ol>

  <h2>Jak sprawdzić, czy masz ten problem</h2>

  <ul>
    <li><b>Porównaj liczbę transakcji w GA4 z systemem sprzedażowym.</b> Najszybszy test: zestaw liczbę zdarzeń purchase i wartość przychodu w GA4 za wybrany dzień z rzeczywistą liczbą zamówień i obrotem z panelu sklepu albo bramki płatności. Rozbieżność rzędu kilku–kilkunastu procent w górę to sygnał ostrzegawczy.</li>
    <li><b>Użyj raportu Explore z wymiarem Transaction ID.</b> Zbuduj raport swobodny z metryką „Liczba zdarzeń purchase” rozbitą po wymiarze <i>transaction_id</i>. Jeśli ten sam identyfikator transakcji pojawia się z liczbą zdarzeń większą niż 1, masz potwierdzony duplikat.</li>
    <li><b>Sprawdź znaczniki czasu kolejnych zdarzeń tej samej transakcji.</b> Duplikaty w obrębie tej samej sesji zwykle mają znaczniki czasu odległe o sekundy — to pomaga odróżnić je od dwóch odrębnych, prawdziwych zamówień złożonych przez tego samego klienta tego samego dnia.</li>
    <li><b>Włącz podgląd GTM (Preview) i złóż testowe zamówienie.</b> Obserwuj panel podglądu krok po kroku: jeśli tag purchase odpala się więcej niż raz dla jednego przejścia przez stronę potwierdzenia, problem jest po stronie konfiguracji triggerów, nie po stronie GA4.</li>
  </ul>

  <h2>Jak to naprawić krok po kroku</h2>

  <ol>
    <li>Ustal jedno, jedyne miejsce w architekturze (web GTM albo server-side, nie oba naraz), które jest odpowiedzialne za wysyłkę zdarzenia purchase do GA4.</li>
    <li>Nadaj każdej transakcji unikalny, stabilny <i>transaction_id</i>, generowany raz po stronie backendu i niezmienny przy kolejnych załadowaniach tej samej strony potwierdzenia.</li>
    <li>W GTM sprawdź wszystkie triggery podpięte do tagu purchase i usuń nadmiarowe — zdarzenie powinno odpalać się przez jeden, jednoznaczny trigger (zwykle Custom Event na dedykowanym dataLayer.push), nie przez Page View.</li>
    <li>Dodaj po stronie strony potwierdzenia prostą blokadę przed ponownym wywołaniem dataLayer.push przy odświeżeniu — np. flagę w sessionStorage sprawdzaną przed wysłaniem zdarzenia.</li>
    <li>W aplikacjach SPA przenieś wywołanie zdarzenia purchase poza logikę renderowania komponentu, do jednorazowego efektu wywoływanego dokładnie raz po otrzymaniu potwierdzenia zamówienia z backendu.</li>
    <li>Po wdrożeniu poprawki zweryfikuj w podglądzie GTM i w raporcie Explore z Transaction ID, że każda nowa transakcja pojawia się w GA4 dokładnie raz.</li>
  </ol>

  <h2>Jak AlertGA4 wykrywa zduplikowane zakupy</h2>

  <p>Ten rodzaj błędu jest dokładnie tym, czego Insights w GA4 nie sprawdzi — to nie jest ogólny spadek czy wzrost metryki, tylko konkretna, techniczna niespójność na poziomie pojedynczych zdarzeń i parametrów. AlertGA4 po podłączeniu usługi codziennie sprawdza udział zduplikowanych transakcji po <i>transaction_id</i> i, jeśli przekroczy ustalony próg, wysyła maila z konkretną diagnozą: ile transakcji się powtarza i jaki procent dziennego przychodu to realnie pseudo-przychód z duplikatów.</p>

  <p>Dzięki codziennemu, automatycznemu sprawdzaniu problem wychodzi na jaw tego samego dnia, w którym się pojawił — zanim zdąży wpłynąć na decyzję o budżecie kampanii opartą o zawyżony ROAS.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <ul>
    <li><b>Sklepy internetowe</b>, dla których przychód z GA4 jest wejściem do optymalizacji kampanii — zawyżony ROAS prowadzi wprost do przelewania budżetu w kanały, które w rzeczywistości nie są tak skuteczne, jak wyglądają w raportach.</li>
    <li><b>Agencje performance marketingowe</b>, które rozliczają skuteczność kampanii klienta na podstawie danych z GA4 i mogą nieświadomie raportować lepsze wyniki, niż miały miejsce naprawdę.</li>
    <li><b>Zespoły wdrażające nową integrację e-commerce albo migrujące na server-side tagging</b>, czyli dokładnie w momencie, w którym ryzyko podwójnego wysłania tego samego zdarzenia jest największe.</li>
  </ul>
`

const DUPLICATE_PURCHASE_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy GA4 sam wykrywa zduplikowane zakupy?</summary>
      <div class="blog-faq-answer"><p>Nie. GA4 zlicza każde wystąpienie zdarzenia purchase osobno i nie ma wbudowanego mechanizmu, który automatycznie rozpozna dwa zdarzenia jako tę samą transakcję, nawet przy ustawionym transaction_id.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy ustawienie transaction_id w pełni rozwiązuje problem?</summary>
      <div class="blog-faq-answer"><p>Transaction_id jest niezbędny, żeby w ogóle dało się wykryć duplikat w raportach, ale sam w sobie nie powstrzymuje GA4 przed zliczeniem obu zdarzeń w metrykach przychodu — trzeba jeszcze naprawić przyczynę podwójnego wywołania tagu.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jak duży wpływ na przychód mogą mieć duplikaty?</summary>
      <div class="blog-faq-answer"><p>To zależy od konfiguracji, ale w sklepach z błędem podpiętym do odświeżania strony potwierdzenia zaobserwowane zawyżenie przychodu sięga od kilku do kilkunastu procent, zależnie od tego, jak często klienci odświeżają tę stronę.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy to też problem GTM, czy tylko GA4?</summary>
      <div class="blog-faq-answer"><p>Źródłem problemu jest niemal zawsze konfiguracja wysyłki zdarzenia — GTM, integracja server-side albo kod strony — a nie sam GA4. GA4 po prostu wiernie zlicza to, co dostanie, nawet jeśli dostanie to samo zdarzenie dwa razy.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jak AlertGA4 odróżnia duplikat od dwóch prawdziwych zamówień tego samego klienta?</summary>
      <div class="blog-faq-answer"><p>Check opiera się na identyfikatorze transakcji: dwa zdarzenia purchase z tym samym transaction_id są duplikatem z definicji, niezależnie od tego, czy złożył je ten sam klient, czy nie. Dwa odrębne zamówienia mają zawsze różne transaction_id.</p></div>
    </details>
  </div>
`

const NOT_SET_BODY_HTML = `
  <p>„(not set)” w GA4 potrafi pojawić się właściwie w każdym raporcie: w źródle ruchu, w kanale, w stronie docelowej, w kategorii produktu czy w niestandardowym wymiarze. Część tego zjawiska jest naturalna i nie da się jej wyeliminować do zera. Problem zaczyna się wtedy, gdy udział „(not set)” rośnie z miesiąca na miesiąc albo nagle skacze — bo wtedy prawie zawsze oznacza to realny błąd pomiarowy, a nie tylko statystyczny szum.</p>

  <h2>Czym właściwie jest „(not set)” w GA4</h2>

  <p>„(not set)” to etykieta, którą GA4 pokazuje wtedy, gdy dla danego zdarzenia nie ma wartości przypisanej do konkretnego wymiaru w raporcie. GA4 zarejestrował zdarzenie — sesję, zdarzenie niestandardowe, zakup — ale konkretny wymiar, po którym akurat grupujesz dane, nie miał dla tego zdarzenia żadnej wartości do pokazania.</p>

  <p>To ważna różnica względem „braku danych”: zdarzenie samo w sobie dotarło do GA4 poprawnie, tylko jeden z atrybutów, które mu towarzyszą, jest pusty albo nie został odczytany.</p>

  <h2>Gdzie najczęściej widać „(not set)”</h2>

  <ul>
    <li><b>Źródło/medium i kanał domyślny.</b> Najbardziej rozpoznawalny przypadek — sesja nie ma przypisanego źródła ruchu, więc trafia do kanału „(not set)” zamiast np. Organic Search czy Paid Social.</li>
    <li><b>Strona docelowa (landing page).</b> Zdarza się przy nietypowych przekierowaniach albo gdy parametr strony nie zdążył się załadować przed wysłaniem zdarzenia.</li>
    <li><b>Kraj i miasto.</b> GA4 nie zawsze jest w stanie zgeolokalizować adres IP, zwłaszcza przy ruchu z sieci VPN, firmowych serwerów proxy czy części ruchu botowego.</li>
    <li><b>Nazwa produktu, kategoria produktu, inne wymiary e-commerce.</b> Pojawia się, gdy parametr produktu (item_name, item_category) nie został wysłany razem ze zdarzeniem, mimo że samo zdarzenie e-commerce dotarło.</li>
    <li><b>Niestandardowe wymiary (custom dimensions).</b> Bardzo częsta przyczyna: parametr zdarzenia jest wysyłany poprawnie, ale wymiar niestandardowy oparty na nim nie został zarejestrowany w ustawieniach GA4 — i historyczne dane sprzed rejestracji zawsze pokażą „(not set)”.</li>
  </ul>

  <h2>Najczęstsze przyczyny</h2>

  <ol>
    <li><b>Brak parametrów UTM na linkach z kanałów, które sam kontrolujesz.</b> Newsletter, posty organiczne w social media czy linki z materiałów PDF bez UTM-ów trafiają często do ruchu bez jasno określonego źródła.</li>
    <li><b>Klienci poczty i aplikacje mobilne usuwające referrer.</b> Część klientów e-mail i aplikacji społecznościowych otwiera linki w wewnętrznej przeglądarce, która nie przekazuje nagłówka referrer, więc GA4 nie ma skąd wziąć źródła ruchu bez UTM-ów.</li>
    <li><b>Brak poprawnej konfiguracji cross-domain measurement.</b> Jeśli proces zakupowy przechodzi przez inną domenę (np. zewnętrzną bramkę płatności) bez poprawnie skonfigurowanego linkowania domen, GA4 może zgubić oryginalne źródło sesji po powrocie na główną domenę.</li>
    <li><b>Wymiar niestandardowy zarejestrowany już po tym, jak dane zaczęły napływać.</b> GA4 nie przelicza wstecz „(not set)” na rzeczywistą wartość parametru dla zdarzeń sprzed rejestracji wymiaru niestandardowego w panelu administracyjnym.</li>
    <li><b>Kolejność ładowania zmiennych w GTM.</b> Jeśli tag wysyła zdarzenie, zanim zmienna z wartością parametru zdąży się ustawić (np. przez asynchroniczne pobranie danych produktu), parametr dociera pusty.</li>
    <li><b>Tryb zgodności i ograniczony sygnał (Consent Mode).</b> Przy braku zgody na niektóre kategorie plików cookie część sygnałów bywa modelowana albo ograniczona, co może zwiększać udział brakujących wartości w niektórych wymiarach.</li>
    <li><b>Naturalny, niemożliwy do wyeliminowania „ciemny ruch”.</b> Część ruchu bezpośredniego i część geolokalizacji zawsze pozostanie bez pełnych danych — to nie jest błąd do naprawienia, tylko ograniczenie samego pomiaru w przeglądarce.</li>
  </ol>

  <h2>Jak sprawdzić skalę problemu</h2>

  <ul>
    <li>W raporcie pozyskania dodaj wymiar drugorzędny i sprawdź, jaki procent sesji w ostatnich 30 dniach ma „(not set)” w źródle/medium — potraktuj to jako punkt odniesienia dla przyszłych porównań.</li>
    <li>Dla niestandardowych wymiarów sprawdź w Admin → Custom definitions, od kiedy dany wymiar jest w ogóle zarejestrowany — „(not set)” sprzed tej daty jest oczekiwane i nie wymaga naprawy.</li>
    <li>Rozbij udział „(not set)” po urządzeniu i źródle ruchu — skok ograniczony tylko do jednego kanału (np. kampanii e-mail) zwykle wskazuje konkretne, łatwe do naprawienia miejsce, a nie ogólny problem pomiarowy.</li>
  </ul>

  <h2>Jak ograniczyć udział „(not set)” krok po kroku</h2>

  <ol>
    <li>Dodaj parametry UTM do wszystkich linków w kanałach, które kontrolujesz: newsletter, social media, materiały PDF, podpisy mailowe.</li>
    <li>Skonfiguruj cross-domain measurement w ustawieniach strumienia danych GA4, jeśli ścieżka zakupowa przechodzi przez zewnętrzną domenę płatności.</li>
    <li>Zarejestruj brakujące niestandardowe wymiary w Admin → Custom definitions najszybciej, jak to możliwe po wdrożeniu nowego parametru w GTM — każdy dzień zwłoki to dzień utraconych, niemożliwych do odzyskania danych.</li>
    <li>W GTM sprawdź kolejność wywołania zmiennych względem triggera tagu i w razie potrzeby opóźnij wysyłkę zdarzenia do momentu, gdy wartość parametru jest już dostępna.</li>
    <li>Ustal realistyczny próg akceptowalnego „(not set)” dla swojej branży i ruchu (zwykle kilka procent) zamiast dążyć do zera — część z tego zjawiska wynika z ograniczeń samej przeglądarki i prywatności użytkowników, nie z błędu konfiguracji.</li>
    <li>Monitoruj udział „(not set)” cyklicznie, nie tylko raz po wdrożeniu poprawek — nowa integracja czy zmiana w GTM potrafi po cichu podnieść go z powrotem.</li>
  </ol>

  <h2>Jak AlertGA4 monitoruje „(not set)”</h2>

  <p>AlertGA4 sprawdza codziennie udział „(not set)” w kluczowych wymiarach — źródle/medium, stronie docelowej i wybranych wymiarach niestandardowych — i porównuje go z poprzednimi dniami. Gdy udział przekroczy ustalony próg albo nagle skoczy względem typowego poziomu, dostajesz maila z dokładną wartością i zmianą procentową, zamiast musieć co jakiś czas ręcznie sprawdzać ten sam raport w interfejsie GA4.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <ul>
    <li><b>Zespoły marketingowe oceniające skuteczność kanałów</b>, dla których wysoki udział „(not set)” w źródle ruchu zaniża realny wkład konkretnych kampanii w ruch i konwersje.</li>
    <li><b>Sklepy internetowe z rozbudowanym katalogiem produktów</b>, gdzie „(not set)” w kategorii czy nazwie produktu uniemożliwia wiarygodną analizę sprzedaży na poziomie asortymentu.</li>
    <li><b>Agencje wdrażające GTM u wielu klientów naraz</b>, gdzie łatwo przeoczyć, że nowy niestandardowy wymiar wysyłany jest prawidłowo z kodu, ale nigdy nie został zarejestrowany po stronie GA4.</li>
  </ul>
`

const NOT_SET_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy da się całkowicie wyeliminować „(not set)” w GA4?</summary>
      <div class="blog-faq-answer"><p>Nie w pełni. Część ruchu bezpośredniego, część geolokalizacji i część sygnałów ograniczonych przez ustawienia prywatności zawsze pozostanie bez wartości dla niektórych wymiarów. Celem jest ograniczenie tej części, która wynika z błędów konfiguracyjnych, a nie zejście do zera.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jaki poziom „(not set)” jest uznawany za normalny?</summary>
      <div class="blog-faq-answer"><p>To zależy od branży i źródeł ruchu, ale zwykle kilka procent sesji z „(not set)” w źródle/medium nie jest powodem do niepokoju. Sygnałem ostrzegawczym jest nie sam poziom, tylko nagły wzrost względem dotychczasowej normy.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy „(not set)” zawsze oznacza błąd w GTM?</summary>
      <div class="blog-faq-answer"><p>Nie zawsze. Może wynikać z braku UTM-ów na linkach, z klientów pocztowych usuwających referrer, z trybu zgodności na pliki cookie albo z niezarejestrowanego wymiaru niestandardowego — dopiero rozbicie po kanale i urządzeniu pokazuje, która przyczyna dominuje.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy rejestracja wymiaru niestandardowego naprawi dane historyczne?</summary>
      <div class="blog-faq-answer"><p>Nie. GA4 nie przelicza wstecz zdarzeń sprzed rejestracji niestandardowego wymiaru — będą trwale oznaczone jako „(not set)” dla tego wymiaru. Dlatego warto rejestrować nowe wymiary od razu po wdrożeniu nowego parametru w GTM.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jak AlertGA4 ustala próg, przy którym wysyła alert?</summary>
      <div class="blog-faq-answer"><p>Check porównuje bieżący udział „(not set)” w danym wymiarze z jego typowym poziomem z poprzednich dni dla tej samej usługi GA4, więc próg jest dopasowany do realnego wzorca danego konta, a nie jednej sztywnej wartości dla wszystkich.</p></div>
    </details>
  </div>
`

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'alerty-w-google-analytics-4',
    title: 'Alerty w Google Analytics 4: możliwości, ograniczenia i gdzie potrzeba czegoś więcej',
    excerpt: 'Czym są Insights w GA4, jak je skonfigurować, gdzie kończą się ich możliwości i czym różnią się od codziennego monitoringu AlertGA4.',
    targetPhrase: 'alerty w GA4',
    status: 'published',
    publishedAt: '2026-10-19',
    bodyHtml: ALERTS_BODY_HTML,
    faqHtml: ALERTS_FAQ_HTML,
  },
  {
    slug: 'audyt-ga4-checklist',
    title: 'Audyt GA4 — checklist 10 rzeczy, które warto sprawdzić, zanim zaufasz raportom',
    excerpt: 'Praktyczna lista kontrolna: dziesięć miejsc, w których GA4 najczęściej kłamie, zanim błąd trafi do miesięcznego raportu.',
    targetPhrase: 'audyt GA4',
    status: 'coming-soon',
  },
  {
    slug: 'self-referral-ga4',
    title: 'Self-referral w GA4: dlaczego Twoja domena pojawia się jako źródło ruchu i jak to naprawić',
    excerpt: 'Dlaczego własna domena potrafi wyglądać jak zewnętrzne źródło ruchu w GA4 i jak to naprawić krok po kroku.',
    targetPhrase: 'self-referral GA4',
    status: 'coming-soon',
  },
  {
    slug: 'zduplikowane-zakupy-ga4',
    title: 'Zduplikowane zakupy w GA4 — jak pseudo-przychód zafałszowuje Twoje raporty e-commerce',
    excerpt: 'Jak zdublowane zdarzenie zakupu zawyża przychód i ROAS, i jak to wykryć zanim wpłynie na budżet reklamowy.',
    targetPhrase: 'zduplikowane zakupy GA4',
    status: 'published',
    publishedAt: '2026-10-19',
    bodyHtml: DUPLICATE_PURCHASE_BODY_HTML,
    faqHtml: DUPLICATE_PURCHASE_FAQ_HTML,
  },
  {
    slug: 'ruch-botowy-ga4',
    title: 'Ruch nocny i boty w GA4: jak odróżnić prawdziwych użytkowników od szumu',
    excerpt: 'Jak rozpoznać ruch botowy w danych GA4 i dlaczego wbudowany filtr botów nie wyłapuje wszystkiego.',
    targetPhrase: 'ruch botowy GA4',
    status: 'coming-soon',
  },
  {
    slug: 'brakujace-eventy-ga4',
    title: 'Brakujące eventy w GA4 — jak sprawdzić, czy śledzisz to, co naprawdę ważne',
    excerpt: 'Dlaczego zdarzenia potrafią przestać być wysyłane bez żadnego błędu i jak to systematycznie wychwytywać.',
    targetPhrase: 'brakujące eventy GA4',
    status: 'coming-soon',
  },
  {
    slug: 'not-set-ga4',
    title: 'Dlaczego w GA4 widzisz „(not set)” i jak to naprawić krok po kroku',
    excerpt: 'Najczęstsze źródła „(not set)” w źródle, kanale i stronie lądowania oraz jak ograniczyć ich udział.',
    targetPhrase: '(not set) GA4',
    status: 'published',
    publishedAt: '2026-10-19',
    bodyHtml: NOT_SET_BODY_HTML,
    faqHtml: NOT_SET_FAQ_HTML,
  },
  {
    slug: 'ruch-direct-ga4',
    title: 'Podejrzanie wysoki ruch „Direct” w GA4? Oto co może się za tym kryć',
    excerpt: 'Kiedy wysoki udział ruchu Direct jest normalny, a kiedy oznacza utratę danych o prawdziwym źródle.',
    targetPhrase: 'ruch direct GA4',
    status: 'coming-soon',
  },
  {
    slug: 'lejek-ecommerce-ga4',
    title: 'Lejek e-commerce w GA4: gdzie najczęściej tracisz klientów i jak to zmierzyć',
    excerpt: 'Jak odróżnić realny problem biznesowy od błędu pomiarowego w lejku od wyświetlenia produktu do zakupu.',
    targetPhrase: 'lejek e-commerce GA4',
    status: 'coming-soon',
  },
  {
    slug: 'anomalie-geo-ga4',
    title: 'Anomalie geograficzne w GA4 — gdy ruch z nieoczekiwanych krajów psuje Twoje dane',
    excerpt: 'Skąd się bierze nietypowy ruch z zagranicznych krajów i jak odróżnić go od naturalnego wzrostu rynku.',
    targetPhrase: 'anomalie geo GA4',
    status: 'coming-soon',
  },
  {
    slug: 'alertga4-dla-agencji',
    title: 'AlertGA4 dla agencji — jak monitorować GA4 wielu klientów z jednego konta',
    excerpt: 'Jak agencje obsługujące kilkanaście kont GA4 naraz ograniczają czas poświęcany na ręczną kontrolę jakości danych.',
    targetPhrase: 'monitoring GA4 dla agencji',
    status: 'coming-soon',
  },
  {
    slug: 'koszt-bledu-ga4',
    title: 'Ile kosztuje błąd w GA4? Realna cena złych danych w decyzjach marketingowych',
    excerpt: 'Dlaczego koszt błędu pomiarowego w GA4 zwykle przewyższa koszt narzędzia, które by go wykryło wcześniej.',
    targetPhrase: 'koszt błędu w GA4',
    status: 'coming-soon',
  },
]

export function getPublishedPosts(): BlogPost[] {
  return BLOG_POSTS
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

export function getAllPostsForIndex(): BlogPost[] {
  // Published posts first (newest first), then upcoming ones in catalog order.
  return [...getPublishedPosts(), ...BLOG_POSTS.filter(p => p.status === 'coming-soon')]
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug && p.status === 'published')
}
