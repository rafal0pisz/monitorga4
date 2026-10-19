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
}

const ALERTS_BODY_HTML = `
  <p>Firmy często zakładają, że skoro GA4 zbiera dane o ruchu i konwersjach, samo też da znać, gdy coś w tych danych zacznie się psuć. GA4 rzeczywiście ma do tego mechanizm: Insights. Ten artykuł pokazuje, czym on jest, jak go skonfigurować, gdzie kończą się jego możliwości i czym różni się od codziennego, zautomatyzowanego monitoringu takiego jak AlertGA4.</p>

  <h2>Czym są alerty w Google Analytics 4</h2>

  <p>Universal Analytics, poprzednik GA4, miał funkcję Custom Alerts: definiowało się próg dla wybranej metryki, a system wysyłał maila, gdy został przekroczony. GA4 nie ma funkcji o tej samej nazwie ani działającej w ten sam sposób. Zamiast tego ma panel Insights, dostępny pod ikoną dzwonka w prawym górnym rogu każdego raportu.</p>

  <p>Insights dzielą się na dwa rodzaje. Pierwszy to insighty automatyczne, które GA4 generuje samodzielnie na podstawie własnych modeli statystycznych analizujących dane konta na bieżąco. Taki insight może na przykład zgłosić nagły wzrost liczby sesji z konkretnego kraju albo spadek konwersji w jednym kanale, bez żadnej konfiguracji z Twojej strony.</p>

  <p>Drugi rodzaj to insighty niestandardowe, nazywane Custom Insights. Definiuje się je samodzielnie: wybiera się metrykę do obserwacji, opcjonalny wymiar, warunek uruchomienia (na przykład spadek o więcej niż 20 procent względem poprzedniego tygodnia) oraz częstotliwość sprawdzania.</p>

  <p>W obu przypadkach powiadomienie trafia przede wszystkim do samego panelu Insights w interfejsie GA4. Żeby je zobaczyć, trzeba tam wejść. Mailowe powiadomienia o insightach są dostępne w ograniczonym zakresie i nie działają dla każdego typu insightu tak niezawodnie, jak kiedyś działały Custom Alerts w Universal Analytics.</p>

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
    <li><b>Reguły trzeba wymyślić samemu.</b> GA4 nie ma gotowych, predefiniowanych checków pod konkretne, znane problemy pomiarowe: self-referral, zdublowane zdarzenie zakupu, ruch botowy w nocy, udział „(not set)” w źródle ruchu. Żeby złapać taki problem insightem, trzeba najpierw wiedzieć, że w ogóle może wystąpić, i samodzielnie ułożyć pod niego regułę.</li>
    <li><b>Powiadomienia działają głównie w interfejsie.</b> Żeby dowiedzieć się o problemie, trzeba regularnie wchodzić do panelu Insights. W praktyce rzadko ktoś robi to codziennie, zwłaszcza gdy odpowiada za kilka kont naraz.</li>
    <li><b>Liczba własnych insightów na usługę jest ograniczona.</b> Nie da się monitorować nieograniczonej liczby reguł jednocześnie na jednej usłudze GA4, więc trzeba wybierać, co jest najważniejsze.</li>
    <li><b>Insight to sygnał, nie diagnoza.</b> Wiadomość „sesje spadły o 24 procent” nie mówi, czy przyczyną jest self-referral, zepsuty tag, zmiana w kampanii czy realny spadek zainteresowania ofertą. Dalsze dochodzenie to już ręczna praca analityka.</li>
    <li><b>Każda usługa ma osobny panel.</b> Przy kilku czy kilkudziesięciu klientach, typowych dla agencji, oznacza to wchodzenie do każdej usługi GA4 z osobna, bez jednego zbiorczego widoku wszystkich kont naraz.</li>
    <li><b>Insights nie obejmują pokrycia parametrów ani zdarzeń e-commerce.</b> Mechanizm operuje na gotowych metrykach GA4 i nie sprawdzi, czy parametr <i>currency</i> dociera razem ze zdarzeniem <i>purchase</i>, albo czy w lejku e-commerce nie brakuje zdarzenia <i>begin_checkout</i>.</li>
    <li><b>Powiadomienie widzi tylko osoba zalogowana na danym koncie Google.</b> Insights nie mają wbudowanego sposobu na rozesłanie informacji do całego zespołu czy do klienta, dla którego prowadzisz konto. Żeby ktoś inny się dowiedział, trzeba mu to ręcznie przekazać.</li>
  </ul>

  <p>Żadne z tych ograniczeń nie czyni Insights bezużytecznym. Problem pojawia się wtedy, gdy firma traktuje go jako kompletny system monitoringu i przestaje szukać czegoś więcej, mimo że właśnie te sześć punktów odpowiada za większość realnych, kosztownych błędów pomiarowych w GA4.</p>

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
    <img src="/blog/alertga4-dashboard.png" alt="Dashboard AlertGA4 z listą monitorowanych projektów i ich wynikami jakości danych" loading="lazy" />
    <figcaption>Dashboard AlertGA4: wszystkie monitorowane usługi GA4 z aktualnym wynikiem i trendem w jednym miejscu.</figcaption>
  </figure>

  <p>Gdy któryś check wykryje problem, dostajesz maila z konkretną diagnozą: który dokładnie wskaźnik nie przeszedł, jaką ma wartość i jak zmieniła się względem poprzedniego okresu. To jest różnica wobec samego insightu: zamiast „coś się zmieniło”, dostajesz informację w stylu „self-referral wzrósł do 3,2 procent sesji, z 0,3 procent tydzień wcześniej”.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-checks.png" alt="Widok checków AlertGA4 dla konkretnego projektu, z wynikami Pass, Warn i Fail" loading="lazy" />
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

  <table class="blog-table">
    <tr><th>Cecha</th><th>Insights w GA4</th><th>AlertGA4</th></tr>
    <tr><td>Gotowe reguły pod znane problemy (self-referral, duplikaty, boty, „(not set)”)</td><td>Nie, trzeba samodzielnie zdefiniować regułę</td><td>Tak, od razu po podłączeniu usługi</td></tr>
    <tr><td>Codzienne powiadomienie mailem z diagnozą</td><td>Ograniczone, głównie w interfejsie GA4</td><td>Tak, codziennie lub tylko przy problemie</td></tr>
    <tr><td>Osobny alert dla wybranych, krytycznych metryk</td><td>Nie</td><td>Tak</td></tr>
    <tr><td>Widok wielu usług i klientów w jednym miejscu</td><td>Nie, każda usługa osobno</td><td>Tak, jeden dashboard</td></tr>
    <tr><td>Sprawdzanie pokrycia parametrów i zdarzeń e-commerce</td><td>Nie</td><td>Tak</td></tr>
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

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'alerty-w-google-analytics-4',
    title: 'Alerty w Google Analytics 4: możliwości, ograniczenia i gdzie potrzeba czegoś więcej',
    excerpt: 'Czym są Insights w GA4, jak je skonfigurować, gdzie kończą się ich możliwości i czym różnią się od codziennego monitoringu AlertGA4.',
    targetPhrase: 'alerty w GA4',
    status: 'published',
    publishedAt: '2026-10-19',
    bodyHtml: ALERTS_BODY_HTML,
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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
