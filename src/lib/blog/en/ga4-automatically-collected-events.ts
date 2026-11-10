import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Once you connect GA4 to a website, some events show up in reports before anyone writes a single line of tracking code. That's easy to misread: if GA4 starts showing something on its own, it's tempting to assume everything you need is already working.</p>

  <p>In reality, GA4 splits events into three clearly different categories, each with a different level of automation. This article covers which events really do collect themselves, which ones you turn on with a toggle, and why some parameters, even though GA4 is sending them, don't show up anywhere in reports until you register them manually.</p>

  <h2>Three categories of events in GA4</h2>

  <p>Google splits GA4 events into three groups, and understanding this split is key to knowing what actually needs your attention:</p>

  <ul>
    <li><b>Events collected always, with no way to turn them off.</b> They work as soon as you install the base GA4 tag, regardless of any settings.</li>
    <li><b>Enhanced measurement events.</b> Enabled by default in most cases, but controlled by individual toggles you can turn off or fine-tune.</li>
    <li><b>Recommended and custom events.</b> GA4 doesn't collect these at all until someone sends them manually, through gtag, Google Tag Manager, or a direct Measurement Protocol call.</li>
  </ul>

  <h2>Events GA4 can't be turned off</h2>

  <p>Three events always work, regardless of your Enhanced measurement settings and regardless of whether you even know they exist:</p>

  <ul>
    <li><b>first_visit</b>, sent once, on a given user's first visit to the site.</li>
    <li><b>session_start</b>, sent at the start of every new session.</li>
    <li><b>user_engagement</b>, sent periodically for as long as a user is actively using the site in the foreground of their browser. This is what powers engagement-time metrics.</li>
  </ul>

  <p>These three events require no configuration or decision on your part. The only thing you can do with them is ignore them, since turning them off simply isn't an option.</p>

  <h2>Enhanced measurement: events you turn on with a toggle</h2>

  <p>Enhanced measurement is a set of events GA4 can collect automatically straight from the page's own code, with no manual implementation in the data layer, as long as the relevant toggle is on. Each one can be disabled individually, which rarely makes sense in practice, but it's worth knowing the option exists.</p>

  <table class="blog-table">
    <tr><th>Event</th><th>What triggers it</th><th>Key parameters</th><th>Enabled by default</th></tr>
    <tr><td>page_view</td><td>a page view, including a URL change in single-page applications</td><td>page_location, page_referrer, page_title</td><td>Yes</td></tr>
    <tr><td>scroll</td><td>scrolling to at least 90 percent of the page's length</td><td>percent_scrolled</td><td>Yes</td></tr>
    <tr><td>click</td><td>clicking a link that leads off the current domain</td><td>link_url, link_domain, outbound</td><td>Yes</td></tr>
    <tr><td>view_search_result</td><td>landing on a URL containing a recognized search parameter</td><td>search_term</td><td>Yes</td></tr>
    <tr><td>video_start / video_progress / video_complete</td><td>playing an embedded YouTube video</td><td>video_title, video_url, video_current_time</td><td>Yes</td></tr>
    <tr><td>file_download</td><td>clicking a link to a file, e.g. pdf, docx, xlsx</td><td>file_name, file_extension, link_url</td><td>Yes</td></tr>
    <tr><td>form_start / form_submit</td><td>the first interaction with a form and its submission</td><td>form_id, form_destination</td><td>Yes</td></tr>
  </table>

  <p>All of these toggles live in one place: your Web data stream's settings.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 760 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Path in the GA4 admin panel to the Enhanced measurement settings: Admin, Data Streams, selecting your Web stream, the Enhanced measurement icon">
      <defs>
        <marker id="arrowA" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8b939a" />
        </marker>
      </defs>
      <rect x="10" y="40" width="160" height="100" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="90" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">STEP 1</text>
      <text x="90" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Admin</text>
      <text x="90" y="104" text-anchor="middle" font-size="10.5" fill="#8b939a">gear icon in the</text>
      <text x="90" y="118" text-anchor="middle" font-size="10.5" fill="#8b939a">bottom left corner</text>

      <line x1="170" y1="90" x2="196" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowA)" />

      <rect x="200" y="40" width="160" height="100" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="280" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">STEP 2</text>
      <text x="280" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Data Streams</text>
      <text x="280" y="104" text-anchor="middle" font-size="10.5" fill="#8b939a">"Property" column</text>
      <text x="280" y="118" text-anchor="middle" font-size="10.5" fill="#8b939a">in Admin</text>

      <line x1="360" y1="90" x2="386" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowA)" />

      <rect x="390" y="40" width="160" height="100" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="470" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">STEP 3</text>
      <text x="470" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Your Web stream</text>
      <text x="470" y="104" text-anchor="middle" font-size="10.5" fill="#8b939a">click your domain</text>
      <text x="470" y="118" text-anchor="middle" font-size="10.5" fill="#8b939a">in the stream list</text>

      <line x1="550" y1="90" x2="576" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowA)" />

      <rect x="580" y="30" width="170" height="120" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="665" y="55" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">STEP 4</text>
      <text x="665" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="#166534">Enhanced measurement</text>
      <text x="665" y="98" text-anchor="middle" font-size="10.5" fill="#166534">gear icon next to</text>
      <text x="665" y="112" text-anchor="middle" font-size="10.5" fill="#166534">the toggle up top</text>
    </svg>
    <figcaption>An illustrative path to the Enhanced measurement settings in the GA4 admin panel. The exact menu layout may differ slightly depending on the interface version.</figcaption>
  </figure>

  <p>Once you reach this screen you'll see the full list of events from the table above, each with its own toggle. It's worth reviewing it once after launch and deliberately deciding whether you actually need all of them, instead of leaving the defaults unchecked.</p>

  <h2>A parameter you have to declare by hand: on-site search</h2>

  <p>The view_search_result event is a good example of "automatic" not always meaning "will work with zero configuration." GA4 fires it when it detects one of its recognized search parameters in the URL, most commonly q, s, search, query, or keyword.</p>

  <p>The problem shows up when your site's search uses a different parameter name, say ?keywords=shoes instead of ?q=shoes. In that case GA4 won't recognize the URL as a search result, the view_search_result event won't fire, and the search_term parameter will stay empty, even though the user genuinely searched for something.</p>

  <p>The fix is simple, but you need to know it exists: in the Enhanced measurement settings, under the site search section, you can add your own parameter name to the recognized list.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 760 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Site search settings panel inside GA4 Enhanced measurement, showing the default recognized URL parameters and where to add a custom one">
      <defs>
        <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#16a34a" />
        </marker>
      </defs>

      <rect x="10" y="10" width="330" height="210" rx="12" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="30" y="36" font-size="13" font-weight="700" fill="#232b31">Enhanced measurement</text>

      <text x="30" y="68" font-size="11.5" fill="#3a4148">Page views</text>
      <rect x="268" y="58" width="34" height="16" rx="8" fill="#16a34a" />
      <circle cx="294" cy="66" r="6" fill="#fff" />

      <text x="30" y="100" font-size="11.5" fill="#3a4148">Scrolls</text>
      <rect x="268" y="90" width="34" height="16" rx="8" fill="#16a34a" />
      <circle cx="294" cy="98" r="6" fill="#fff" />

      <rect x="18" y="118" width="314" height="40" rx="8" fill="#f0fdf4" />
      <text x="30" y="134" font-size="11.5" font-weight="600" fill="#166534">Site search</text>
      <rect x="208" y="124" width="34" height="16" rx="8" fill="#16a34a" />
      <circle cx="234" cy="132" r="6" fill="#fff" />
      <circle cx="300" cy="140" r="11" fill="#fff" stroke="#16a34a" stroke-width="1.5" />
      <text x="300" y="144" text-anchor="middle" font-size="12" fill="#16a34a">⚙</text>
      <text x="30" y="150" font-size="10" fill="#166534">URL query parameters</text>

      <text x="30" y="192" font-size="11.5" fill="#3a4148">File downloads</text>
      <rect x="268" y="182" width="34" height="16" rx="8" fill="#16a34a" />
      <circle cx="294" cy="190" r="6" fill="#fff" />

      <line x1="311" y1="140" x2="420" y2="90" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrowB)" />

      <rect x="430" y="10" width="320" height="210" rx="12" fill="#fff" stroke="#16a34a" stroke-width="1.5" />
      <text x="450" y="36" font-size="12.5" font-weight="700" fill="#232b31">Search term query parameters</text>
      <text x="450" y="60" font-size="10.5" fill="#8b939a">Recognized by default:</text>
      <text x="450" y="78" font-size="11.5" fill="#5b6570">q · s · search · query · keyword</text>
      <line x1="450" y1="92" x2="730" y2="92" stroke="#e2e6e8" />
      <text x="450" y="114" font-size="10.5" fill="#8b939a">Add your own if your search uses</text>
      <text x="450" y="128" font-size="10.5" fill="#8b939a">a different parameter name:</text>
      <rect x="450" y="140" width="110" height="34" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="4 3" />
      <text x="505" y="162" text-anchor="middle" font-size="12.5" font-weight="700" fill="#166534">keywords</text>
      <circle cx="570" cy="157" r="10" fill="#16a34a" />
      <text x="570" y="161" text-anchor="middle" font-size="13" fill="#fff">+</text>
      <text x="450" y="196" font-size="10" fill="#8b939a">e.g. ?keywords=shoes instead of ?q=shoes</text>
    </svg>
    <figcaption>The default list of search parameters in Enhanced measurement settings, and where to add your own, custom URL parameter.</figcaption>
  </figure>

  <p>Without this step, sites with a custom search engine consistently lose data on what their users are actually searching for, even though the rest of Enhanced measurement works fine.</p>

  <h2>Why a parameter can reach GA4 and still not show up in reports</h2>

  <p>This is one of the most commonly misunderstood mechanics in GA4. An event and its parameters can reach GA4 completely correctly, visible even in a single event's details in the Realtime report, and still not be available as a column or dimension in standard reports or Explorations.</p>

  <p>The reason is simple: GA4 only shows an event parameter as a full-fledged dimension for analysis once you register it as a custom dimension. Without that step, the parameter exists in the raw event data, but you can't use it for segmentation, filtering, or building your own breakdown.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 620 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Form for creating a custom dimension in GA4 for the search_term event parameter">
      <rect x="10" y="10" width="600" height="240" rx="12" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="30" y="40" font-size="14" font-weight="700" fill="#232b31">New custom dimension</text>

      <text x="30" y="66" font-size="10.5" fill="#8b939a">Dimension name</text>
      <rect x="30" y="72" width="560" height="34" rx="6" fill="#f3f6f7" stroke="#e2e6e8" />
      <text x="42" y="94" font-size="11.5" fill="#232b31">Search term</text>

      <text x="30" y="128" font-size="10.5" fill="#8b939a">Scope</text>
      <rect x="30" y="134" width="270" height="34" rx="6" fill="#f3f6f7" stroke="#e2e6e8" />
      <text x="42" y="156" font-size="11.5" fill="#232b31">Event</text>
      <text x="282" y="156" font-size="11" fill="#8b939a">▾</text>

      <text x="320" y="128" font-size="10.5" fill="#8b939a">Event parameter</text>
      <rect x="320" y="134" width="270" height="34" rx="6" fill="#f3f6f7" stroke="#e2e6e8" />
      <text x="332" y="156" font-family="monospace" font-size="11.5" fill="#232b31">search_term</text>

      <rect x="460" y="196" width="140" height="38" rx="8" fill="#16a34a" />
      <text x="530" y="220" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">Save</text>
    </svg>
    <figcaption>Registering an event parameter as a custom dimension in GA4, using the search_term parameter sent with the view_search_result event as an example.</figcaption>
  </figure>

  <p>It's worth remembering that a standard GA4 property only allows a limited number of event-scoped custom dimensions, so it doesn't pay to register every parameter automatically. It's better to deliberately pick the ones you'll actually use in analysis, reports, or segmentation.</p>

  <h2>Recommended and custom events: what GA4 doesn't collect on its own at all</h2>

  <p>The third category is events GA4 doesn't collect in any automatic way, regardless of your Enhanced measurement settings. They split into two groups:</p>

  <ul>
    <li><b>Recommended events.</b> Google publishes ready-made names and parameter schemas for typical business actions: login, sign_up, purchase, add_to_cart, generate_lead, begin_checkout, and similar. GA4 understands these names and presents them correctly in standard e-commerce reports, but you have to send them yourself, through gtag or Google Tag Manager.</li>
    <li><b>Custom events.</b> Actions specific to your business, such as downloading a price sheet, signing up for a newsletter, or opening a particular calculator, have no ready-made name in GA4 at all. You define the name, structure, and parameters from scratch, ideally sticking to the same naming convention as recommended events: lowercase, underscores instead of spaces.</li>
  </ul>

  <p>Both types need the same thing: someone to implement them in the data layer or directly in the code, and to test that they actually reach GA4 with the correct parameters before reporting starts to depend on them. We cover that kind of verification separately in <a href="/en/blog/ga4-event-verification">our GA4 event verification guide</a>.</p>

  <h2>Checklist after a GA4 launch</h2>

  <figure class="blog-figure">
    <div class="blog-checklist">
      <div class="blog-checklist-head">Before you call a GA4 implementation complete</div>
      <ul class="blog-checklist-list">
        <li><span class="blog-checklist-check">✓</span> You've reviewed the Enhanced measurement toggles and deliberately decided which stay on</li>
        <li><span class="blog-checklist-check">✓</span> If your site's search uses its own URL parameter, you've added it to the recognized list</li>
        <li><span class="blog-checklist-check">✓</span> Key event parameters (e.g. search_term, currency, transaction_id) are registered as custom dimensions</li>
        <li><span class="blog-checklist-check">✓</span> Recommended events for key business actions (purchase, lead, sign-up) are implemented under the exact name GA4 expects</li>
        <li><span class="blog-checklist-check">✓</span> Custom events specific to your business follow a consistent naming convention</li>
        <li><span class="blog-checklist-check">✓</span> Every new event has been verified in DebugView before the implementation is considered done</li>
      </ul>
    </div>
  </figure>

  <h2>How AlertGA4 watches event and parameter coverage</h2>

  <p>Even correctly implemented events and parameters can stop working months after launch, triggered by a completely unrelated change elsewhere on the site. Once you connect a GA4 property, AlertGA4 checks the presence of configured events and their parameter coverage every day, comparing the current day against that same account's historical baseline.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-checks.png" alt="AlertGA4 checks view with a list of monitored events and their status" width="1280" height="900" loading="lazy" />
    <figcaption>Every monitored event has its own status, current volume, and change against the previous period.</figcaption>
  </figure>

  <p>When a key parameter, like search_term or transaction_id, stops arriving with its event, you get an email the same day, instead of finding out at the next monthly data review.</p>

  <p>The biggest cost of this category of bugs isn't missing data outright, it's the false sense that the data is complete, when in reality a single deliberate configuration step was missed at launch and nobody thought of it since.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Is page_view an automatic event in GA4?</summary>
      <div class="blog-faq-answer"><p>Technically it's part of Enhanced measurement, not one of the unconditionally collected events like first_visit or session_start. It's on by default and can be turned off in your stream settings, though in practice almost nobody does that.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How do I add a custom search parameter to GA4?</summary>
      <div class="blog-faq-answer"><p>In Enhanced measurement settings, under the site search section, add the URL parameter name your search uses to the recognized list, alongside the defaults like q or search.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Why doesn't an event parameter show up in GA4 reports, even though I see it in real time?</summary>
      <div class="blog-faq-answer"><p>Because a parameter simply being present in the event data isn't enough for it to become a dimension available for analysis. You have to register it as a custom dimension in your property settings.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What's the difference between recommended events and custom events?</summary>
      <div class="blog-faq-answer"><p>Recommended events have a ready-made name and parameter schema defined by Google, like purchase or sign_up. Custom events have no ready-made pattern at all, you set the name and parameters yourself.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is turning on Enhanced measurement enough for complete data in GA4?</summary>
      <div class="blog-faq-answer"><p>No. Enhanced measurement covers typical general interactions, but it doesn't cover business events like a purchase or a sign-up, or events specific to your site, which always have to be implemented manually.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-automatically-collected-events',
  plSlug: 'automatyczne-zdarzenia-ga4',
  title: "Automatically collected events in GA4: what's tracked on its own, and what you still have to declare",
  excerpt: 'Which events GA4 collects with zero configuration, which ones you switch on through Enhanced measurement, and why some parameters still need to be registered by hand before they show up in reports.',
  targetPhrase: 'GA4 automatically collected events',
  status: 'published',
  publishedAt: '2026-11-08',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
