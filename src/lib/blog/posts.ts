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
  <p>Firmy często zakładają, że skoro GA4 zbiera dane o ruchu i konwersjach, samo też da znać, gdy coś w tych danych zacznie się psuć. GA4 rzeczywiście ma do tego mechanizm: Insights.</p>

  <p>Ten artykuł pokazuje, czym on jest, jak go skonfigurować, gdzie kończą się jego możliwości i czym różni się od codziennego, zautomatyzowanego monitoringu takiego jak AlertGA4.</p>

  <h2>Czym są alerty w Google Analytics 4</h2>

  <p>Universal Analytics, poprzednik GA4, miał funkcję Custom Alerts: definiowało się próg dla wybranej metryki, a system wysyłał maila, gdy został przekroczony. GA4 nie ma funkcji o tej samej nazwie ani działającej w ten sam sposób. Zamiast tego ma panel Insights, dostępny pod ikoną dzwonka w prawym górnym rogu każdego raportu.</p>

  <p>Insights dzielą się na dwa rodzaje. Pierwszy to insighty automatyczne, które GA4 generuje samodzielnie na podstawie własnych modeli statystycznych analizujących dane konta na bieżąco. Taki insight może na przykład zgłosić nagły wzrost liczby sesji z konkretnego kraju albo spadek konwersji w jednym kanale, bez żadnej konfiguracji z Twojej strony.</p>

  <p>Drugi rodzaj to insighty niestandardowe, nazywane Custom Insights. Definiuje się je samodzielnie: wybiera się metrykę do obserwacji, opcjonalny wymiar, warunek uruchomienia (na przykład spadek o więcej niż 20 procent względem poprzedniego tygodnia) oraz częstotliwość sprawdzania.</p>

  <p>W obu przypadkach powiadomienie trafia do panelu Insights w interfejsie GA4, a część insightów GA4 wysyła też mailem.</p>

  <p>Różnica wobec dedykowanego monitoringu jakości danych nie leży więc w tym, czy mail w ogóle istnieje, tylko w tym, czego dotyczy: insight operuje na ogólnych metrykach, takich jak sesje, użytkownicy czy konwersje, i nie zejdzie do poziomu konkretnego zdarzenia, parametru czy transakcji.</p>

  <p>Ta różnica wynika z tego, jak Google przebudował całą analitykę przy przejściu z Universal Analytics na GA4. Universal Analytics była zbudowana wokół sesji i stron, a Custom Alerts działały na prostych, zdefiniowanych przez użytkownika progach liczbowych.</p>

  <p>GA4 jest zbudowana wokół zdarzeń i modeli uczenia maszynowego, więc Google zastąpił proste progi mechanizmem opartym na wykrywaniu anomalii statystycznych. To rozwiązanie bywa trafniejsze przy naprawdę nietypowych zmianach, ale gorzej radzi sobie z pilnowaniem konkretnych, z góry znanych reguł biznesowych, dokładnie takich, jakich oczekiwały stare Custom Alerts.</p>

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

  <p>Żadne z tych ograniczeń nie czyni Insights bezużytecznym — to wciąż realne alerty, które potrafią trafić na maila.</p>

  <p>Problem pojawia się wtedy, gdy firma traktuje ten ogólny poziom jako kompletny system monitoringu i przestaje szukać czegoś, co zejdzie do konkretnych zdarzeń i parametrów, mimo że właśnie tam kryje się większość realnych, kosztownych błędów pomiarowych w GA4.</p>

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

  <p>Konfiguracja nowego projektu nie wymaga ręcznego wpisywania nazw zdarzeń czy parametrów. Kreator czyta rzeczywiste dane z podłączonej usługi GA4 i podpowiada, które zdarzenia i parametry warto monitorować, razem z ich wolumenem z ostatnich 30 dni.</p>

  <p>Poza codziennym, automatycznym sprawdzaniem dostępny jest też ręczny przycisk „Uruchom teraz”, przydatny zaraz po naprawieniu jakiegoś problemu, gdy nie chcesz czekać do następnego dnia na potwierdzenie, że rzeczywiście zniknął.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <p>Różnica między samym Insights a pełnym monitoringiem jakości danych nie jest tylko teoretyczna. W praktyce najbardziej odczuwają ją trzy grupy.</p>

  <ul>
    <li><b>Sklepy internetowe</b>, dla których zduplikowany event zakupu albo zepsuty lejek e-commerce bezpośrednio zniekształca raportowany przychód i ocenę skuteczności kampanii reklamowych.</li>
    <li><b>Agencje marketingowe i analityczne</b>, które odpowiadają za kilka lub kilkadziesiąt kont GA4 naraz i nie mają czasu, żeby codziennie przeglądać panel Insights osobno w każdej z nich.</li>
    <li><b>Zespoły wewnętrzne bez dedykowanego analityka</b>, dla których insight w stylu „sesje spadły o 24 procent” nie niesie żadnej konkretnej wskazówki, co dalej zrobić.</li>
  </ul>

  <h2>Porównanie: Insights w GA4 a AlertGA4</h2>

  <p>Insights w GA4 to realne alerty, które mogą trafiać także na maila — to nie jest fikcyjna funkcja.</p>

  <p>Różnica wobec AlertGA4 nie leży więc w tym, czy powiadomienie w ogóle istnieje, tylko na jakim poziomie szczegółowości działa: GA4 informuje o ogólnych statystykach, takich jak sesje, użytkownicy czy konwersje, a AlertGA4 schodzi do konkretnych zdarzeń, parametrów i transakcji.</p>

  <table class="blog-table">
    <tr><th>Cecha</th><th>Insights w GA4</th><th>AlertGA4</th></tr>
    <tr><td>Czy to w ogóle alert mailowy</td><td>Tak, ale tylko dla części insightów i w ograniczonym zakresie</td><td>Tak, codziennie lub tylko przy problemie</td></tr>
    <tr><td>Poziom szczegółowości</td><td>Ogólne statystyki: sesje, użytkownicy, konwersje</td><td>Konkretne zdarzenia i parametry: self-referral, duplikaty zakupu, „(not set)”, pokrycie parametrów</td></tr>
    <tr><td>Gotowe reguły pod znane problemy (self-referral, duplikaty, boty, „(not set)”)</td><td>Nie, trzeba samodzielnie zdefiniować regułę na ogólnej metryce</td><td>Tak, od razu po podłączeniu usługi</td></tr>
    <tr><td>Sprawdzanie pokrycia parametrów i zdarzeń e-commerce</td><td>Nie</td><td>Tak</td></tr>
    <tr><td>Widok wielu usług i klientów w jednym miejscu</td><td>Nie, każda usługa osobno</td><td>Tak, jeden dashboard</td></tr>
    <tr><td>Osobny alert dla wybranych, krytycznych metryk</td><td>Tak, ale na poziomie ogólnej metryki</td><td>Tak, na poziomie konkretnego checka</td></tr>
    <tr><td>Czas potrzebny na skonfigurowanie pierwszego alertu</td><td>Trzeba samodzielnie dobrać metrykę, próg i częstotliwość</td><td>Kreator podpowiada na podstawie realnych danych z usługi</td></tr>
    <tr><td>Koszt</td><td>Wliczone w GA4, bezpłatne</td><td>Płatny abonament, od planu Lite</td></tr>
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
  <p>Przychód w GA4 to jedna z metryk, na które patrzy się najczęściej i którym ufa się najmniej krytycznie — w końcu to GA4 ma po prostu zliczyć to, co faktycznie się sprzedało.</p>

  <p>Problem w tym, że event <i>purchase</i> potrafi wystrzelić więcej niż raz dla tej samej transakcji, a GA4 domyślnie nie ma jak tego samodzielnie wykryć. Efekt: przychód, ROAS i liczba zamówień w raportach GA4 są wyższe niż w rzeczywistości, często o kilka do kilkunastu procent, bez żadnego ostrzeżenia w interfejsie.</p>

  <h2>Czym jest zduplikowany zakup w GA4</h2>

  <p>Zduplikowany zakup to sytuacja, w której zdarzenie <i>purchase</i> z tymi samymi (albo bardzo podobnymi) danymi transakcji zostaje wysłane do GA4 więcej niż raz.</p>

  <p>GA4 nie ma wbudowanego mechanizmu, który automatycznie rozpozna dwa zdarzenia jako „tę samą transakcję” — chyba że parametr <i>transaction_id</i> jest ustawiony i spójny, a nawet wtedy GA4 i tak zlicza oba wystąpienia zdarzenia osobno w większości standardowych raportów, nie prowadząc pełnej deduplikacji po stronie interfejsu.</p>

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

  <p>Ten rodzaj błędu jest dokładnie tym, czego Insights w GA4 nie sprawdzi — to nie jest ogólny spadek czy wzrost metryki, tylko konkretna, techniczna niespójność na poziomie pojedynczych zdarzeń i parametrów.</p>

  <p>AlertGA4 po podłączeniu usługi codziennie sprawdza udział zduplikowanych transakcji po <i>transaction_id</i> i, jeśli przekroczy ustalony próg, wysyła maila z konkretną diagnozą: ile transakcji się powtarza i jaki procent dziennego przychodu to realnie pseudo-przychód z duplikatów.</p>

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
  <p>„(not set)” w GA4 potrafi pojawić się właściwie w każdym raporcie: w źródle ruchu, w kanale, w stronie docelowej, w kategorii produktu czy w niestandardowym wymiarze. Część tego zjawiska jest naturalna i nie da się jej wyeliminować do zera.</p>

  <p>Problem zaczyna się wtedy, gdy udział „(not set)” rośnie z miesiąca na miesiąc albo nagle skacze — bo wtedy prawie zawsze oznacza to realny błąd pomiarowy, a nie tylko statystyczny szum.</p>

  <h2>Czym właściwie jest „(not set)” w GA4</h2>

  <p>„(not set)” to etykieta, którą GA4 pokazuje wtedy, gdy dla danego zdarzenia nie ma wartości przypisanej do konkretnego wymiaru w raporcie. GA4 zarejestrował zdarzenie — sesję, zdarzenie niestandardowe, zakup — ale konkretny wymiar, po którym akurat grupujesz dane, nie miał dla tego zdarzenia żadnej wartości do pokazania.</p>

  <p>To ważna różnica względem „braku danych”: zdarzenie samo w sobie dotarło do GA4 poprawnie, tylko jeden z atrybutów, które mu towarzyszą, jest pusty albo nie został odczytany.</p>

  <h2>Gdzie najczęściej widać „(not set)”</h2>

  <ul>
    <li><b>Strona docelowa (landing page).</b> Zdarza się przy nietypowych przekierowaniach albo gdy parametr strony nie zdążył się załadować przed wysłaniem zdarzenia.</li>
    <li><b>Kraj i miasto.</b> GA4 nie zawsze jest w stanie zgeolokalizować adres IP, zwłaszcza przy ruchu z sieci VPN, firmowych serwerów proxy czy części ruchu botowego.</li>
    <li><b>Nazwa produktu, kategoria produktu, inne wymiary e-commerce.</b> Pojawia się, gdy parametr produktu (item_name, item_category) nie został wysłany razem ze zdarzeniem, mimo że samo zdarzenie e-commerce dotarło.</li>
    <li><b>Niestandardowe wymiary (custom dimensions).</b> Bardzo częsta przyczyna: parametr zdarzenia jest wysyłany poprawnie, ale wymiar niestandardowy oparty na nim nie został zarejestrowany w ustawieniach GA4 — i historyczne dane sprzed rejestracji zawsze pokażą „(not set)”.</li>
  </ul>

  <h2>Najczęstsze przyczyny</h2>

  <ol>
    <li><b>To nie jest brak UTM-ów — to osobny problem.</b> Częsty mit: ruch bez parametrów kampanii i bez referrera trafia do „(not set)”. W rzeczywistości taki ruch GA4 klasyfikuje jako Direct, czyli „(direct)/(none)” — to świadoma, prawidłowa wartość, nie brak danych. Jeśli chcesz ograniczyć udział ruchu Direct, warto dodawać UTM-y do linków, które kontrolujesz, ale to osobne zadanie, niepowiązane z „(not set)”.</li>
    <li><b>Zerwana ciągłość sesji przy cross-domain measurement.</b> Jeśli proces zakupowy przechodzi przez inną domenę (np. zewnętrzną bramkę płatności) bez poprawnie skonfigurowanego linkowania domen, GA4 może zgubić dane sesji po powrocie na główną domenę — kolejne zdarzenia trafiają wtedy z „(not set)” w źródle/medium.</li>
    <li><b>Zdarzenia wysyłane przez Measurement Protocol albo integrację server-side bez danych sesji przeglądarki.</b> Eventy wysyłane bezpośrednio z backendu — np. potwierdzenie zamówienia złożonego telefonicznie albo import konwersji offline — nie mają powiązanej sesji z przeglądarki, więc GA4 nie ma skąd wziąć źródła ruchu.</li>
    <li><b>Zdarzenie niestandardowe odpalone w GTM, zanim GA4 zdążył ustanowić sesję.</b> Zła kolejność triggerów — zdarzenie wystrzelone przed tagiem konfiguracyjnym GA4 — może dotrzeć bez kontekstu sesji.</li>
    <li><b>Wymiar niestandardowy zarejestrowany już po tym, jak dane zaczęły napływać.</b> GA4 nie przelicza wstecz „(not set)” na rzeczywistą wartość parametru dla zdarzeń sprzed rejestracji wymiaru niestandardowego w panelu administracyjnym.</li>
    <li><b>Kolejność ładowania zmiennych w GTM.</b> Jeśli tag wysyła zdarzenie, zanim zmienna z wartością parametru zdąży się ustawić (np. przez asynchroniczne pobranie danych produktu), parametr dociera pusty.</li>
    <li><b>Tryb zgodności i ograniczony sygnał (Consent Mode).</b> Przy braku zgody na niektóre kategorie plików cookie część sygnałów bywa modelowana albo ograniczona, co może zwiększać udział brakujących wartości w niektórych wymiarach.</li>
  </ol>

  <h2>Jak sprawdzić skalę problemu</h2>

  <ul>
    <li>W raporcie pozyskania dodaj wymiar drugorzędny i sprawdź, jaki procent sesji w ostatnich 30 dniach ma „(not set)” w źródle/medium — potraktuj to jako punkt odniesienia dla przyszłych porównań.</li>
    <li>Dla niestandardowych wymiarów sprawdź w Admin → Custom definitions, od kiedy dany wymiar jest w ogóle zarejestrowany — „(not set)” sprzed tej daty jest oczekiwane i nie wymaga naprawy.</li>
    <li>Rozbij udział „(not set)” po urządzeniu i źródle ruchu — skok ograniczony tylko do jednego kanału (np. kampanii e-mail) zwykle wskazuje konkretne, łatwe do naprawienia miejsce, a nie ogólny problem pomiarowy.</li>
  </ul>

  <h2>Jak ograniczyć udział „(not set)” krok po kroku</h2>

  <ol>
    <li>Skonfiguruj cross-domain measurement w ustawieniach strumienia danych GA4, jeśli ścieżka zakupowa przechodzi przez zewnętrzną domenę płatności — to najczęstsza przyczyna „(not set)” w źródle/medium.</li>
    <li>Jeśli wysyłasz zdarzenia przez Measurement Protocol albo integrację server-side, dołączaj do nich dane sesji (client_id, session_id) zamiast wysyłać zdarzenie w oderwaniu od sesji przeglądarkowej.</li>
    <li>W GTM sprawdź kolejność triggerów — zdarzenia niestandardowe powinny odpalać się po tagu konfiguracyjnym GA4, nie przed nim.</li>
    <li>Zarejestruj brakujące niestandardowe wymiary w Admin → Custom definitions najszybciej, jak to możliwe po wdrożeniu nowego parametru w GTM — każdy dzień zwłoki to dzień utraconych, niemożliwych do odzyskania danych.</li>
    <li>W GTM sprawdź kolejność wywołania zmiennych względem triggera tagu i w razie potrzeby opóźnij wysyłkę zdarzenia do momentu, gdy wartość parametru jest już dostępna.</li>
    <li>Ustal realistyczny próg akceptowalnego „(not set)” dla swojej branży i ruchu (zwykle kilka procent) zamiast dążyć do zera — część z tego zjawiska wynika z ograniczeń samej przeglądarki i prywatności użytkowników, nie z błędu konfiguracji.</li>
    <li>Monitoruj udział „(not set)” cyklicznie, nie tylko raz po wdrożeniu poprawek — nowa integracja czy zmiana w GTM potrafi po cichu podnieść go z powrotem.</li>
  </ol>

  <h2>Jak AlertGA4 monitoruje „(not set)”</h2>

  <p>AlertGA4 sprawdza codziennie udział „(not set)” w kluczowych wymiarach — źródle/medium, stronie docelowej i wybranych wymiarach niestandardowych — i porównuje go z poprzednimi dniami.</p>

  <p>Gdy udział przekroczy ustalony próg albo nagle skoczy względem typowego poziomu, dostajesz maila z dokładną wartością i zmianą procentową, zamiast musieć co jakiś czas ręcznie sprawdzać ten sam raport w interfejsie GA4.</p>

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
      <div class="blog-faq-answer"><p>Nie zawsze. Może wynikać ze zerwanej ciągłości sesji przy cross-domain measurement, ze zdarzeń wysyłanych przez Measurement Protocol bez danych sesji, z trybu zgodności na pliki cookie albo z niezarejestrowanego wymiaru niestandardowego — dopiero rozbicie po źródle zdarzenia i urządzeniu pokazuje, która przyczyna dominuje. Ważne: to coś innego niż ruch bez UTM-ów, który GA4 klasyfikuje jako Direct, nie jako „(not set)”.</p></div>
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

const THRESHOLDS_BODY_HTML = `
  <p>Czasem raport w GA4 wygląda, jakby część ruchu po prostu zniknęła. Rozbijasz sesje po płci i kampanii, a dla jednej z grup widzisz puste pole, mimo że wiesz, że ten segment miał tego dnia realny ruch.</p>

  <p>To nie jest błąd pomiarowy ani kolejna odmiana „(not set)” — to progi danych (data thresholds), mechanizm prywatności, który GA4 stosuje świadomie i bez wyjątków, gdy łączysz zbyt wrażliwe wymiary przy zbyt małej grupie użytkowników.</p>

  <h2>Czym są progi danych w GA4</h2>

  <p>Progi danych to zabezpieczenie zbliżone do k-anonimowości: GA4 nie pokaże wiersza raportu, jeśli opisywana przez niego grupa użytkowników jest na tyle mała, że teoretycznie dałoby się ją zidentyfikować.</p>

  <p>Dotyczy to przede wszystkim wymiarów powiązanych z Google Signals — wieku, płci, kategorii zainteresowań — zwłaszcza gdy łączysz je z dodatkowym, zawężającym wymiarem, takim jak kampania, miasto czy konkretne zdarzenie.</p>

  <p>To mechanizm celowy, działający niezależnie od tego, czy korzystasz z niego świadomie. Nie da się go wyłączyć wybiórczo dla jednego raportu — można jedynie ograniczyć sytuacje, w których się uruchamia.</p>

  <p>Warto odróżnić to od „(not set)”, które opisaliśmy osobno w <a href="/blog/not-set-ga4">artykule o „(not set)” w GA4</a>. „(not set)” oznacza, że zdarzenie dotarło, ale zabrakło mu wartości dla danego wymiaru. Próg danych działa inaczej: zdarzenie i jego wartości istnieją, ale GA4 świadomie nie pokazuje całego wiersza, żeby nie ujawnić zbyt małej, potencjalnie identyfikowalnej grupy.</p>

  <p>Z perspektywy osoby czytającej raport obie sytuacje wyglądają podobnie — pusty wiersz albo brakująca wartość — ale wymagają zupełnie innej reakcji. „(not set)” zwykle da się ograniczyć poprawą konfiguracji pomiaru. Progu danych nie da się „naprawić” w ten sposób, bo nie jest wynikiem błędu — jest wynikiem zbyt małej próby.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram pokazujący, jak progi danych w GA4 ukrywają wiersz raportu z za małą liczbą użytkowników">
      <defs>
        <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8b939a" />
        </marker>
      </defs>
      <rect x="16" y="78" width="168" height="64" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="100" y="104" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">Zapytanie o raport</text>
      <text x="100" y="121" text-anchor="middle" font-size="11" fill="#5b6570">np. płeć × kampania</text>
      <line x1="184" y1="110" x2="224" y2="110" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHead)" />
      <rect x="228" y="68" width="200" height="84" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="328" y="98" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">Czy grupa ma za mało</text>
      <text x="328" y="115" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">unikalnych użytkowników?</text>
      <text x="328" y="134" text-anchor="middle" font-size="11" fill="#5b6570">próg k-anonimowości Google</text>
      <line x1="432" y1="90" x2="470" y2="48" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHead)" />
      <text x="447" y="60" text-anchor="middle" font-size="11" font-weight="600" fill="#ca8a04">tak</text>
      <line x1="432" y1="130" x2="470" y2="172" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHead)" />
      <text x="447" y="160" text-anchor="middle" font-size="11" font-weight="600" fill="#16a34a">nie</text>
      <rect x="474" y="16" width="190" height="64" rx="10" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5" />
      <text x="569" y="42" text-anchor="middle" font-size="12" font-weight="600" fill="#92650a">Wiersz ukryty</text>
      <text x="569" y="59" text-anchor="middle" font-size="11" fill="#92650a">pusta wartość albo „0”, bez ostrzeżenia</text>
      <rect x="474" y="172" width="190" height="64" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="569" y="198" text-anchor="middle" font-size="12" font-weight="600" fill="#166534">Wartość widoczna</text>
      <text x="569" y="215" text-anchor="middle" font-size="11" fill="#166534">raportowana normalnie</text>
    </svg>
    <figcaption>Uproszczony schemat działania progów danych: GA4 ukrywa cały wiersz, zamiast pokazać niedokładną wartość.</figcaption>
  </figure>

  <h2>Kiedy się włączają</h2>

  <ul>
    <li><b>Google Signals jest włączony.</b> To najczęstszy wyzwalacz — Google Signals odpowiada za wymiary demograficzne i zainteresowania, a to właśnie one najczęściej podlegają progom.</li>
    <li><b>Raport łączy kilka wymiarów naraz.</b> Pojedynczy wymiar, na przykład sam wiek, rzadko jest problemem przy większym ruchu. Ryzyko rośnie, gdy zestawiasz go z drugim, zawężającym wymiarem — konkretną kampanią, miastem czy niszowym zdarzeniem konwersji.</li>
    <li><b>Niski wolumen ruchu dla danego segmentu.</b> Małe usługi GA4 albo wąskie segmenty, na przykład jeden zagraniczny rynek czy kampania z niewielkim budżetem, trafiają na próg znacznie częściej niż ruch zagregowany na poziomie całej usługi.</li>
    <li><b>Eksploracje z własnymi, szczegółowymi zestawieniami.</b> Im bardziej szczegółowy, autorski raport budujesz, tym łatwiej nieświadomie złożyć kombinację wymiarów, która trafi na próg.</li>
  </ul>

  <h2>Jak odróżnić próg danych od realnego braku ruchu</h2>

  <ul>
    <li><b>Sprawdź, czy GA4 pokazuje komunikat o progach.</b> W standardowych raportach i Eksploracjach GA4 zwykle informuje wprost, że część danych została ukryta z powodu progów — to pierwszy i najpewniejszy sygnał.</li>
    <li><b>Porównaj z sumą zagregowaną.</b> Jeśli ogólna liczba sesji dla danego dnia jest wyraźnie większa od zera, a rozbicie po wymiarach demograficznych pokazuje puste wiersze, to zwykle próg, nie realny brak ruchu.</li>
    <li><b>Sprawdź to samo zestawienie dla szerszego okresu.</b> Rozciągnięcie zakresu dat z jednego dnia na 30 dni zwykle odsłania dane, które wcześniej były ukryte — sam ten fakt potwierdza, że przyczyną był próg, a nie brak ruchu.</li>
    <li><b>Pamiętaj, że Data API nie zawsze sygnalizuje to tak czytelnie jak interfejs.</b> Jeśli budujesz własne raporty na GA4 Data API, zapytanie o zbyt szczegółową kombinację wymiarów może zwrócić po prostu mniej wierszy niż się spodziewasz, bez równie wyraźnego ostrzeżenia jak w interfejsie GA4 — warto mieć to z tyłu głowy przy projektowaniu własnych dashboardów.</li>
  </ul>

  <h2>Jak ograniczyć wpływ progów danych</h2>

  <ol>
    <li>Wydłuż okres raportowania. Więcej dni to więcej użytkowników w każdej grupie, a to zmniejsza szansę na przekroczenie progu.</li>
    <li>Ogranicz liczbę jednocześnie łączonych wymiarów. Zamiast od razu zestawiać trzy wymiary naraz, zacznij od jednego i dokładaj kolejne tylko tam, gdzie wolumen na to pozwala.</li>
    <li>Zastanów się, czy Twoja usługa w ogóle potrzebuje Google Signals. Jeśli nie korzystasz z remarketingu ani raportowania między urządzeniami, wyłączenie Google Signals znacząco ogranicza liczbę sytuacji, w których progi się uruchamiają.</li>
    <li>Dla naprawdę szczegółowej, zdarzeniowej analizy rozważ eksport do BigQuery. Surowe, nieagregowane dane zdarzeń eksportowane do BigQuery nie podlegają temu samemu mechanizmowi progowania co raporty w interfejsie i w Data API — to właściwe miejsce, gdy standardowe raportowanie GA4 systematycznie nie wystarcza.</li>
    <li>Nie traktuj pustego wiersza jako ostatecznej informacji biznesowej. Zanim wyciągniesz wniosek z brakującej wartości, sprawdź, czy to nie efekt progu — w przeciwnym razie łatwo błędnie uznać, że dany segment nie generuje ruchu, podczas gdy po prostu jest zbyt mały, żeby GA4 chciał go pokazać.</li>
  </ol>

  <h2>Jak AlertGA4 radzi sobie z progami danych</h2>

  <p>AlertGA4 nie sprawdza wymiarów demograficznych ani zainteresowań — to właśnie one najczęściej trafiają na próg. Codzienne checki opierają się na wymiarach i metrykach zdarzeniowych: źródle i medium, parametrach e-commerce, identyfikatorze transakcji, nazwach i kategoriach zdarzeń.</p>

  <p>W praktyce oznacza to, że progi danych rzadko mają wpływ na wyniki monitoringu — a jeśli któryś check pokaże nagły spadek albo zero tam, gdzie go wcześniej nie było, zwykle oznacza to realny problem pomiarowy opisany w innych artykułach tego bloga, a nie efekt progowania.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <ul>
    <li><b>Zespoły budujące własne dashboardy na Data API</b>, które mogą nieświadomie zinterpretować brakujące wiersze jako realny spadek ruchu w danym segmencie.</li>
    <li><b>Marketing analizujący dane demograficzne i zainteresowania</b>, gdzie segmentacja kampanii według wieku czy płci najczęściej trafia na próg przy mniejszym ruchu.</li>
    <li><b>Firmy z wieloma rynkami albo wąskimi segmentami odbiorców</b>, dla których pojedynczy, niszowy rynek może systematycznie pokazywać niepełne dane demograficzne.</li>
  </ul>

  <p>We wszystkich trzech przypadkach błąd interpretacyjny jest ten sam: potraktowanie pustego wiersza jako informacji o rzeczywistości, zamiast jako informacji o tym, że GA4 akurat tej rzeczywistości nie chce pokazać.</p>
`

const THRESHOLDS_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy progi danych to błąd w GA4?</summary>
      <div class="blog-faq-answer"><p>Nie. To celowy mechanizm ochrony prywatności, uruchamiany automatycznie, gdy grupa opisywana przez wiersz raportu jest zbyt mała, żeby pokazać ją bez ryzyka identyfikacji konkretnych osób.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy dotyczy tylko danych demograficznych?</summary>
      <div class="blog-faq-answer"><p>Najczęściej tak, ponieważ wiek, płeć i zainteresowania pochodzą z Google Signals i są najbardziej wrażliwymi wymiarami. Teoretycznie może dotyczyć każdej wystarczająco wąskiej kombinacji wymiarów przy bardzo małym ruchu, ale w praktyce rzadko widać to poza demografią.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy wyłączenie Google Signals całkowicie usuwa progi?</summary>
      <div class="blog-faq-answer"><p>Znacząco ogranicza ryzyko, bo usuwa główne źródło wrażliwych wymiarów, ale nie jest to gwarancja zerowa — przy bardzo małym wolumenie ruchu próg teoretycznie może zadziałać także bez Google Signals.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy eksport do BigQuery rozwiązuje problem?</summary>
      <div class="blog-faq-answer"><p>W dużej mierze tak. Surowe dane eksportowane do BigQuery to zdarzenia na poziomie pojedynczego wystąpienia, bez agregacji, więc nie podlegają temu samemu progowaniu co raporty w interfejsie i w Data API.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy AlertGA4 wykrywa, kiedy zadziałał próg danych?</summary>
      <div class="blog-faq-answer"><p>Nie wprost — AlertGA4 nie analizuje wymiarów, które najczęściej wyzwalają progi. Dzięki temu checki rzadko są w ogóle narażone na ten mechanizm, a nie dlatego, że go rozpoznają i pomijają.</p></div>
    </details>
  </div>
`

const REPORTING_CHECKLIST_BODY_HTML = `
  <p>Najdroższy błąd w raporcie dla klienta to nie ten, który rzuca się w oczy. To liczba, która wygląda wiarygodnie, zostaje zaakceptowana bez pytań, a dopiero miesiąc później ktoś zauważa, że przychód w raporcie nie zgadzał się z systemem sprzedażowym. Ten artykuł to konkretna checklist — kilka punktów do przejścia, zanim raport trafi do skrzynki klienta.</p>

  <h2>Dlaczego ładnie wyglądający raport to za mało</h2>

  <p>Raport, który wygląda źle, zostaje sprawdzony odruchowo — nagły spadek przychodu czy zerowa liczba konwersji budzi czujność samoistnie. Problem w tym, że najbardziej kosztowne błędy pomiarowe w GA4 wyglądają dokładnie odwrotnie: podbijają liczby w górę, nie w dół.</p>

  <p>Zdublowany zakup zawyża przychód. Ruch botowy w nocy zawyża sesje i na pierwszy rzut oka poprawia współczynnik konwersji. Nic z tego nie wygląda jak błąd — dopóki ktoś nie porówna liczb z czymś niezależnym.</p>

  <p>Klient, który zauważy taką rozbieżność samodzielnie, zapamiętuje przede wszystkim jedno: że musiał to wychwycić sam, mimo że płaci za to, żeby ktoś inny tego pilnował. Ta checklist to sposób, żeby nigdy nie być w tej sytuacji po raz drugi.</p>

  <h2>Checklist przed wysłaniem raportu</h2>

  <ol>
    <li><b>Porównaj liczbę transakcji i przychód z systemem sprzedażowym.</b> To najszybszy test na zdublowane zdarzenia zakupu — rozbieżność rzędu kilku procent w górę to sygnał ostrzegawczy, nie zaokrąglenie.</li>
    <li><b>Sprawdź udział „(not set)” w kluczowych wymiarach.</b> Źródło i medium, strona docelowa, kategoria produktu — nagły wzrost względem poprzednich okresów psuje wiarygodność atrybucji kanałów w całym raporcie.</li>
    <li><b>Sprawdź udział ruchu Direct i self-referral.</b> Skokowy wzrost zwykle oznacza utratę atrybucji źródła, nie nagłą popularność marki — a to bezpośrednio wpływa na to, które kanały w raporcie wyglądają na skuteczne.</li>
    <li><b>Sprawdź, czy kluczowe zdarzenia nie spadły do zera w żadnym dniu okresu.</b> Pojedynczy dzień bez formularza kontaktowego czy zdarzenia zakupu łatwo zgubić w sumie miesięcznej, a zwykle oznacza to, że coś przestało działać technicznie, nie że klienci przestali kupować.</li>
    <li><b>Sprawdź pokrycie kluczowych parametrów e-commerce.</b> Transaction_id, currency, item_id — brakujące wartości w części transakcji zafałszowują rozbicie przychodu na produkty czy waluty, nawet gdy sama liczba transakcji się zgadza.</li>
    <li><b>Sprawdź, czy nie ma anomalii geograficznych albo ruchu botowego w nocy.</b> Obie rzeczy podbijają liczbę sesji i potrafią poprawić metryki zaangażowania na pierwszy rzut oka, nie będąc realnym, wartościowym ruchem.</li>
    <li><b>Porównaj okres z poprzednim analogicznym okresem, nie tylko rok do roku.</b> Nagły skok albo spadek bez wytłumaczenia biznesowego — kampanii, sezonu, promocji — to sygnał do sprawdzenia przyczyny, nie do wpisania wprost do podsumowania dla klienta.</li>
    <li><b>Sprawdź, czy liczby z poprzedniego raportu nadal się zgadzają.</b> Retrospektywna zmiana w konfiguracji GA4 albo w samych danych potrafi po cichu przesunąć liczby za wcześniejszy okres — warto raz na jakiś czas zestawić archiwalny raport z tym, co GA4 pokazuje dla tego samego okresu dzisiaj.</li>
  </ol>

  <figure class="blog-figure">
    <div class="blog-checklist">
      <div class="blog-checklist-head">Przed wysłaniem raportu klientowi</div>
      <ul class="blog-checklist-list">
        <li><span class="blog-checklist-check">✓</span> Przychód i liczba transakcji zgadzają się z systemem sprzedażowym</li>
        <li><span class="blog-checklist-check">✓</span> Udział „(not set)” w normie dla tego konta</li>
        <li><span class="blog-checklist-check">✓</span> Ruch Direct i self-referral bez nagłego skoku</li>
        <li><span class="blog-checklist-check">✓</span> Żaden dzień okresu bez kluczowego zdarzenia</li>
        <li><span class="blog-checklist-check">✓</span> Parametry e-commerce (transaction_id, currency, item_id) pokryte</li>
        <li><span class="blog-checklist-check">✓</span> Brak anomalii geograficznych i ruchu botowego w nocy</li>
        <li><span class="blog-checklist-check">✓</span> Zmiana względem poprzedniego okresu ma wytłumaczenie biznesowe</li>
        <li><span class="blog-checklist-check">✓</span> Liczby z poprzedniego raportu nadal się zgadzają</li>
      </ul>
    </div>
    <figcaption>Ta sama checklist w skróconej formie — warto trzymać ją pod ręką przy każdym cyklicznym raporcie.</figcaption>
  </figure>

  <h2>Jak zrobić z tego powtarzalny proces, a nie jednorazową kontrolę</h2>

  <ul>
    <li><b>Sprawdzaj dane 1–2 dni przed wysyłką raportu</b>, nie w dniu wysyłki — zostawia to czas na wyjaśnienie albo naprawienie czegoś, zanim klient zobaczy liczby.</li>
    <li><b>Zapisz checklistę w jednym, wspólnym miejscu dla całego zespołu</b>, żeby nie zależała od pamięci jednej osoby prowadzącej konto.</li>
    <li><b>Traktuj odchylenie od normy jako pytanie, nie jako gotowy wynik.</b> Nagły skok czy spadek bez wytłumaczenia biznesowego — kampanii, sezonu, promocji — zasługuje na sprawdzenie, zanim trafi do raportu jako fakt.</li>
    <li><b>Nie polegaj wyłącznie na pamięci przy wielu kontach naraz.</b> Przy kilkunastu klientach łatwo przejść przez checklistę dokładnie dla dwóch pierwszych kont i pobieżnie dla reszty, zwłaszcza pod koniec miesiąca.</li>
  </ul>

  <h2>Jak AlertGA4 wspiera ten proces</h2>

  <p>Większość punktów tej checklisty to dokładnie to, co AlertGA4 sprawdza automatycznie, codziennie, dla każdego podłączonego konta: duplikaty zakupu, udział „(not set)”, self-referral, ruch botowy w nocy, anomalie geograficzne i pokrycie parametrów.</p>

  <p>Zamiast przechodzić przez checklistę ręcznie tuż przed wysyłką raportu, masz już trzydzieści dni historii wyników dla każdego klienta na jednym dashboardzie — sprawdzenie przed raportem sprowadza się do rzutu oka na wynik i trend, nie do ręcznego przechodzenia przez każdy punkt od zera.</p>

  <p>Dla agencji obsługującej kilkanaście kont jednocześnie różnica jest szczególnie odczuwalna pod koniec miesiąca, gdy większość raportów wychodzi w krótkim odstępie czasu — zamiast powtarzać tę samą ręczną checklistę kilkanaście razy z rzędu, przegląda się kilkanaście dashboardów z gotowym wynikiem.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <ul>
    <li><b>Agencje obsługujące wielu klientów</b>, dla których jeden przeoczony błąd w jednym raporcie kosztuje więcej zaufania niż cała reszta dobrze wykonanej pracy tego miesiąca.</li>
    <li><b>Freelancerzy i analitycy prowadzący konta samodzielnie</b>, bez drugiej osoby, która mogłaby zweryfikować liczby przed wysyłką.</li>
    <li><b>Wewnętrzne zespoły marketingu raportujące do zarządu</b>, gdzie błędna liczba w raporcie wewnętrznym wpływa na decyzje budżetowe tak samo, jak w raporcie dla zewnętrznego klienta.</li>
  </ul>
`

const REPORTING_CHECKLIST_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy ta checklist zastępuje pogłębioną analizę danych?</summary>
      <div class="blog-faq-answer"><p>Nie. To minimalny, techniczny test wiarygodności liczb przed wysyłką, nie zastępuje analizy biznesowej wyników ani interpretacji trendów.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jak często warto przechodzić przez checklistę?</summary>
      <div class="blog-faq-answer"><p>Przy każdym cyklicznym raporcie, najlepiej 1–2 dni przed wysyłką, żeby zostawić czas na reakcję, jeśli coś wymaga poprawy.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Co, jeśli już wysłałem raport z błędną liczbą?</summary>
      <div class="blog-faq-answer"><p>Najlepiej od razu przesłać klientowi krótkie sprostowanie z poprawną liczbą i krótkim wyjaśnieniem przyczyny — milczenie w nadziei, że nikt nie zauważy, kosztuje więcej zaufania niż sama pomyłka.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy małą agencję z dwoma klientami też to dotyczy?</summary>
      <div class="blog-faq-answer"><p>Tak, może nawet bardziej — przy jednym czy dwóch kontach pojedynczy błąd w raporcie stanowi większy odsetek całej relacji z klientami niż przy portfelu kilkudziesięciu kont.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy da się w pełni zautomatyzować tę checklistę?</summary>
      <div class="blog-faq-answer"><p>Dużą część tak — narzędzie monitorujące dane codziennie, takie jak AlertGA4, pokrywa większość punktów automatycznie. Finalna decyzja, czy liczba ma sens biznesowy w kontekście konkretnego klienta, zawsze wymaga jednak krótkiego spojrzenia człowieka.</p></div>
    </details>
  </div>
`

const BOT_TRAFFIC_BODY_HTML = `
  <p>GA4 filtruje ruch botowy domyślnie, więc łatwo założyć, że temat jest już załatwiony. W praktyce wbudowany filtr łapie tylko boty, które sam rozpoznaje — a to coraz mniejsza część całego ruchu zautomatyzowanego trafiającego dziś na strony internetowe.</p>

  <p>Ten artykuł pokazuje, jak rozpoznać to, co przeszło przez filtr, i jakie rozwiązania ograniczają boty jeszcze zanim w ogóle dotrą do strony — nie tylko w samym GA4.</p>

  <h2>Jak GA4 filtruje ruch botowy domyślnie</h2>

  <p>GA4 ma włączone domyślnie i bez możliwości wyłączenia filtrowanie ruchu znanych botów i pająków, oparte na liście IAB/ABC (International Spiders and Bots List). Mechanizm porównuje user-agent żądania z tą listą i odrzuca dopasowania, zanim trafią do raportów.</p>

  <p>To filtr sygnaturowy, nie behawioralny: rozpoznaje konkretne, znane identyfikatory botów, ale nie analizuje tego, jak dana sesja się zachowuje. Bot podszywający się pod zwykłą przeglądarkę — a większość dzisiejszego ruchu zautomatyzowanego tak właśnie robi — nie trafia na tę listę i przechodzi przez filtr bez przeszkód.</p>

  <p>To ważna różnica względem oczekiwań: wiele osób zakłada, że skoro GA4 ma „filtr botów”, temat jest zamknięty raz na zawsze.</p>

  <p>W rzeczywistości lista IAB/ABC jest aktualizowana przez zewnętrzną organizację i obejmuje głównie duże, znane boty — wyszukiwarkowe crawlery, narzędzia monitorujące, publicznie znane skanery. Celowo zbudowany bot, który ma ominąć akurat Twoją stronę, praktycznie nigdy się na niej nie znajdzie.</p>

  <h2>Jak rozpoznać ruch botowy, który przeszedł przez filtr</h2>

  <ul>
    <li><b>Nietypowa koncentracja sesji w nocnych godzinach.</b> Skok ruchu w porach, w których Twoja realna publiczność zwykle śpi, to jeden z najbardziej wiarygodnych sygnałów.</li>
    <li><b>Skrajne wartości czasu trwania sesji albo zaangażowania.</b> Sesje trwające ułamek sekundy albo odwrotnie, nienaturalnie długie i identyczne dla wielu użytkowników, rzadko są realnym zachowaniem człowieka.</li>
    <li><b>Ruch z sieci hostingowych i centrów danych zamiast od dostawców internetu.</b> Prawdziwi użytkownicy łączą się z sieci domowych i mobilnych; skupienie ruchu wokół znanych zakresów adresów IP dostawców chmurowych to typowy ślad zautomatyzowanych skryptów.</li>
    <li><b>Jedna strona wejścia bez dalszej nawigacji, powtórzona w dużej skali.</b> Sesje, które zawsze lądują na tej samej stronie i kończą się bez żadnej dalszej interakcji, zwłaszcza w dużej liczbie z podobnego okna czasowego.</li>
    <li><b>Nagły wzrost sesji bez odpowiadającego wzrostu konwersji.</b> Realny ruch zwykle przekłada się choć trochę na dalsze działania; ruch, który rośnie, podczas gdy liczba leadów czy zakupów stoi w miejscu, zasługuje na sprawdzenie.</li>
  </ul>

  <h2>Jak to sprawdzić w GA4</h2>

  <ol>
    <li>Zbuduj raport swobodny (Explore) z wymiarem godziny i metryką liczby sesji, żeby zobaczyć realny rozkład ruchu w ciągu doby.</li>
    <li>Porównaj ten rozkład z tym, czego się spodziewasz, znając swoją publiczność — sklep z klientami w Polsce nie powinien mieć regularnego szczytu ruchu o trzeciej w nocy czasu polskiego.</li>
    <li>Sprawdź raport technologii (przeglądarka, system operacyjny) pod kątem nietypowej koncentracji na jednej, rzadkiej kombinacji.</li>
    <li>Sprawdź raport geograficzny pod kątem ruchu skupionego wokół lokalizacji typowych dla centrów danych, a nie realnych rynków, na których działasz.</li>
  </ol>

  <figure class="blog-figure">
    <svg viewBox="0 0 660 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wykres sesji w ciągu doby pokazujący nietypowy wzrost ruchu w godzinach nocnych">
      <defs>
        <pattern id="hatchAmber" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#fde68a" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#ca8a04" stroke-width="2" />
        </pattern>
      </defs>
      <text x="30" y="24" font-size="13" font-weight="600" fill="#232b31">Sesje w ciągu doby — przykładowy wzorzec</text>
      <rect x="30" y="38" width="12" height="12" rx="2" fill="#16a34a" />
      <text x="48" y="48" font-size="11.5" fill="#5b6570">typowy ruch w ciągu dnia</text>
      <rect x="215" y="38" width="12" height="12" rx="2" fill="url(#hatchAmber)" stroke="#ca8a04" stroke-width="1.2" />
      <text x="233" y="48" font-size="11.5" fill="#5b6570">podejrzany ruch nocny</text>
      <text x="115" y="72" text-anchor="middle" font-size="11.5" font-weight="600" fill="#ca8a04">prawie tyle samo sesji</text>
      <text x="115" y="86" text-anchor="middle" font-size="11.5" font-weight="600" fill="#ca8a04">co w samo południe</text>
      <path d="M90,96 C90,104 140,104 140,96" fill="none" stroke="#ca8a04" stroke-width="1.5" />
      <line x1="30" y1="220" x2="630" y2="220" stroke="#e2e6e8" stroke-width="1" />
      <rect x="40" y="206" width="30" height="14" rx="3" fill="#16a34a" />
      <text x="55" y="238" text-anchor="middle" font-size="11" fill="#8b939a">0</text>
      <rect x="90" y="111" width="30" height="109" rx="3" fill="url(#hatchAmber)" stroke="#ca8a04" stroke-width="1.5" />
      <text x="105" y="238" text-anchor="middle" font-size="11" fill="#8b939a">2</text>
      <rect x="140" y="118" width="30" height="102" rx="3" fill="url(#hatchAmber)" stroke="#ca8a04" stroke-width="1.5" />
      <text x="155" y="238" text-anchor="middle" font-size="11" fill="#8b939a">4</text>
      <rect x="190" y="202" width="30" height="18" rx="3" fill="#16a34a" />
      <text x="205" y="238" text-anchor="middle" font-size="11" fill="#8b939a">6</text>
      <rect x="240" y="171" width="30" height="49" rx="3" fill="#16a34a" />
      <text x="255" y="238" text-anchor="middle" font-size="11" fill="#8b939a">8</text>
      <rect x="290" y="124" width="30" height="96" rx="3" fill="#16a34a" />
      <text x="305" y="238" text-anchor="middle" font-size="11" fill="#8b939a">10</text>
      <rect x="340" y="101" width="30" height="119" rx="3" fill="#16a34a" />
      <text x="355" y="238" text-anchor="middle" font-size="11" fill="#8b939a">12</text>
      <rect x="390" y="94" width="30" height="126" rx="3" fill="#16a34a" />
      <text x="405" y="238" text-anchor="middle" font-size="11" fill="#8b939a">14</text>
      <rect x="440" y="106" width="30" height="114" rx="3" fill="#16a34a" />
      <text x="455" y="238" text-anchor="middle" font-size="11" fill="#8b939a">16</text>
      <rect x="490" y="118" width="30" height="102" rx="3" fill="#16a34a" />
      <text x="505" y="238" text-anchor="middle" font-size="11" fill="#8b939a">18</text>
      <rect x="540" y="150" width="30" height="70" rx="3" fill="#16a34a" />
      <text x="555" y="238" text-anchor="middle" font-size="11" fill="#8b939a">20</text>
      <rect x="590" y="188" width="30" height="32" rx="3" fill="#16a34a" />
      <text x="605" y="238" text-anchor="middle" font-size="11" fill="#8b939a">22</text>
      <text x="330" y="258" text-anchor="middle" font-size="11" fill="#8b939a">godzina</text>
    </svg>
    <figcaption>Przykładowy wzorzec: sesje o 2:00 i 4:00 w nocy niemal dorównują szczytowi w południe — to typowy ślad ruchu botowego, nie organicznego.</figcaption>
  </figure>

  <h2>Jak ograniczyć ruch botowy poza GA4</h2>

  <p>GA4 strukturalnie widzi tylko boty, które wykonują kod JavaScript na stronie tak jak przeglądarka — każdy bot odpytujący serwer bezpośrednio, bez renderowania strony, nigdy nie trafi do raportów GA4 w żadnej formie, ani jako „dobry”, ani jako „zły” ruch. To dobry powód, żeby nie traktować GA4 jako jedynej linii obrony.</p>

  <ul>
    <li><b>Bot management na poziomie CDN albo WAF.</b> Rozwiązania takie jak Cloudflare Bot Management, AWS WAF Bot Control czy podobne usługi innych dostawców CDN blokują albo wyzywają podejrzany ruch, zanim w ogóle dotrze do serwera, a nie dopiero po fakcie w raportach analitycznych.</li>
    <li><b>Rate limiting na poziomie adresu IP i konkretnych ścieżek.</b> Ograniczenie liczby żądań na minutę do logowania, wyszukiwarki czy checkoutu skutecznie tępi boty skryptowe bez wpływu na normalne korzystanie ze strony.</li>
    <li><b>Wyzwanie CAPTCHA albo JS challenge na wybranych, newralgicznych formularzach.</b> Warto stosować punktowo — na rejestracji, logowaniu, formularzu kontaktowym — a nie na każdej stronie, żeby nie pogarszać doświadczenia realnych użytkowników.</li>
    <li><b>Analiza logów serwera albo CDN, niezależna od GA4.</b> Logi dostępu łapią też boty, które nigdy nie wykonują JavaScriptu i strukturalnie nie mogą pojawić się w żadnym raporcie GA4 — to jedyny sposób, żeby w ogóle zobaczyć tę część ruchu.</li>
    <li><b>Honeypoty — niewidoczne dla człowieka linki albo pola formularza.</b> Realny użytkownik nigdy ich nie kliknie ani nie wypełni; bot indeksujący stronę automatycznie często tak — co pozwala identyfikować i blokować źródłowe adresy IP.</li>
    <li><b>Lista blokowanych adresów IP i zakresów ASN</b>, budowana na podstawie powtarzających się wzorców z logów i z samego GA4 razem, a nie tylko jednego źródła danych.</li>
    <li><b>Robots.txt — rola ograniczona do uczciwych robotów.</b> Plik robots.txt działa jak prośba, nie zabezpieczenie: respektują go wyszukiwarki i inne uczciwe crawlery, ale nie powstrzyma niczego, co celowo chce zeskrobać albo zaspamować Twoją stronę.</li>
  </ul>

  <h2>Jak AlertGA4 pomaga z ruchem botowym</h2>

  <p>AlertGA4 codziennie porównuje udział sesji w nocnych godzinach z typowym poziomem dla danej usługi GA4 z poprzednich dni i wysyła alert, gdy ten udział nagle wzrośnie.</p>

  <p>To nie jest zabezpieczenie blokujące ruch — pełni rolę wczesnego ostrzeżenia, że coś się zmieniło i warto zajrzeć do logów serwera albo panelu bot managementu, zanim zawyżony ruch wpłynie na ocenę skuteczności kampanii czy raport dla klienta.</p>

  <h2>Dla kogo ma to znaczenie</h2>

  <ul>
    <li><b>Sklepy internetowe</b>, dla których zawyżony ruch psuje współczynnik konwersji i utrudnia ocenę realnej skuteczności kampanii.</li>
    <li><b>Produkty SaaS z rejestracją w modelu self-service</b>, gdzie boty rejestrujące konta testowe zawyżają liczbę leadów albo trialów bez żadnej realnej wartości biznesowej.</li>
    <li><b>Agencje raportujące wzrost ruchu klientowi</b>, które ryzykują przedstawienie wzrostu napędzanego botami jako realnego sukcesu kampanii.</li>
  </ul>

  <p>Żadne pojedyncze rozwiązanie z tej listy nie jest kompletną odpowiedzią samo w sobie. Skuteczna ochrona przed ruchem botowym to zawsze kilka warstw naraz: coś, co blokuje ruch na poziomie infrastruktury, coś, co ogranicza nadużycia na newralgicznych formularzach, i coś, co codziennie pilnuje, czy dane w analityce w ogóle wyglądają normalnie.</p>
`

const BOT_TRAFFIC_FAQ_HTML = `
  <h2>Najczęściej zadawane pytania</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Czy GA4 całkowicie blokuje ruch botowy?</summary>
      <div class="blog-faq-answer"><p>Nie. Domyślny filtr rozpoznaje tylko boty z listy IAB/ABC na podstawie user-agenta — ruch podszywający się pod zwykłą przeglądarkę przechodzi przez ten filtr bez przeszkód.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy można wyłączyć domyślne filtrowanie botów w GA4?</summary>
      <div class="blog-faq-answer"><p>Nie, ten filtr działa zawsze i nie ma opcji jego wyłączenia — to jedyny element ochrony przed botami wbudowany w samo GA4.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy ruch z VPN to to samo co ruch botowy?</summary>
      <div class="blog-faq-answer"><p>Nie. VPN zmienia widoczną lokalizację i czasem sieć, z której łączy się realny użytkownik, ale sama sesja wciąż może być w pełni ludzka — oceniaj to razem z innymi sygnałami, takimi jak czas trwania i zaangażowanie, nie samym faktem użycia VPN.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Czy CAPTCHA na stronie głównej rozwiąże problem?</summary>
      <div class="blog-faq-answer"><p>Zwykle nie warto — CAPTCHA na każdej stronie pogarsza doświadczenie realnych użytkowników bardziej, niż to uzasadnione. Lepiej stosować ją punktowo, na formularzach i procesach najbardziej narażonych na nadużycia.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Jak AlertGA4 odróżnia prawdziwy nocny ruch, na przykład z zagranicznego rynku w innej strefie czasowej, od bota?</summary>
      <div class="blog-faq-answer"><p>Check porównuje bieżący udział ruchu nocnego z typowym poziomem dla tej samej usługi GA4 z poprzednich dni, więc stały, realny ruch z innej strefy czasowej staje się po prostu nową normą — alert wywołuje dopiero odchylenie od tej ustalonej normy, nie sam fakt ruchu w nocy.</p></div>
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
    title: 'Ruch botowy w GA4: jak go rozpoznać i jak sobie z nim radzić także poza GA4',
    excerpt: 'Jak rozpoznać ruch botowy, który przeszedł przez domyślny filtr GA4, i jakie rozwiązania ograniczają boty jeszcze zanim dotrą do Twojej strony.',
    targetPhrase: 'ruch botowy GA4',
    status: 'published',
    publishedAt: '2026-10-24',
    bodyHtml: BOT_TRAFFIC_BODY_HTML,
    faqHtml: BOT_TRAFFIC_FAQ_HTML,
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
  {
    slug: 'progi-danych-ga4',
    title: 'Progi danych w GA4 — dlaczego raport nagle pokazuje puste wiersze i jak to rozpoznać',
    excerpt: 'Czym są progi danych (data thresholds) w GA4, kiedy się włączają i jak odróżnić ukryty wiersz od realnego braku ruchu.',
    targetPhrase: 'progi danych GA4',
    status: 'published',
    publishedAt: '2026-10-24',
    bodyHtml: THRESHOLDS_BODY_HTML,
    faqHtml: THRESHOLDS_FAQ_HTML,
  },
  {
    slug: 'checklist-raportowania-ga4',
    title: 'Checklist raportowania GA4 dla agencji — co sprawdzić, zanim wyślesz raport klientowi',
    excerpt: 'Osiem punktów kontrolnych, które warto przejść przed każdym cyklicznym raportem z GA4, żeby nie wysłać klientowi zawyżonych albo niepełnych liczb.',
    targetPhrase: 'checklist raportowania GA4',
    status: 'published',
    publishedAt: '2026-10-24',
    bodyHtml: REPORTING_CHECKLIST_BODY_HTML,
    faqHtml: REPORTING_CHECKLIST_FAQ_HTML,
  },
]

export function getPublishedPosts(): BlogPost[] {
  return BLOG_POSTS
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug && p.status === 'published')
}
