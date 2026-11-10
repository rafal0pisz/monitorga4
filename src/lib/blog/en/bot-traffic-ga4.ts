import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>GA4 filters bot traffic by default, so it's easy to assume the topic is already handled. In practice, the built-in filter only catches bots it already recognizes, and that's an increasingly small slice of all the automated traffic hitting websites today.</p>

  <p>This article shows how to spot what gets through that filter, and which solutions reduce bots before they even reach your site, not just inside GA4 itself.</p>

  <h2>How GA4 filters bot traffic by default</h2>

  <p>GA4 has bot and spider filtering enabled by default, with no option to turn it off, based on the IAB/ABC (International Spiders and Bots List). The mechanism compares a request's user agent against that list and discards matches before they ever reach your reports.</p>

  <p>This is a signature-based filter, not a behavioral one: it recognizes specific, known bot identifiers, but it doesn't analyze how a given session actually behaves. A bot pretending to be a regular browser, which is how most automated traffic behaves today, never shows up on that list and passes through the filter unobstructed.</p>

  <p>That's an important gap against expectations: plenty of people assume that since GA4 has a "bot filter", the subject is closed for good.</p>

  <p>In reality, the IAB/ABC list is maintained by an external organization and mostly covers large, known bots: search engine crawlers, monitoring tools, publicly known scanners. A bot built specifically to target your site will practically never end up on it.</p>

  <h2>How to spot bot traffic that got past the filter</h2>

  <ul>
    <li><b>An unusual concentration of sessions during the night.</b> A spike in traffic at hours when your real audience is normally asleep is one of the most reliable signals.</li>
    <li><b>Extreme session duration or engagement values.</b> Sessions lasting a fraction of a second, or conversely unnaturally long and identical across many users, are rarely genuine human behavior.</li>
    <li><b>Traffic from hosting and data center networks instead of ISPs.</b> Real users connect from home and mobile networks; traffic clustering around known cloud provider IP ranges is a typical footprint of automated scripts.</li>
    <li><b>A single landing page with no further navigation, repeated at scale.</b> Sessions that always land on the same page and end without any further interaction, especially in large numbers within a similar time window.</li>
    <li><b>A sudden rise in sessions with no corresponding rise in conversions.</b> Real traffic usually translates into at least some further action; traffic that grows while leads or purchases stay flat deserves a closer look.</li>
  </ul>

  <h2>How to check this in GA4</h2>

  <ol>
    <li>Build a free-form Explore report with an hour-of-day dimension and a session count metric, to see the real distribution of traffic across the day.</li>
    <li>Compare that distribution against what you'd expect given your actual audience. A store with customers in the US shouldn't have a regular traffic peak at 3am US time.</li>
    <li>Check the technology report (browser, operating system) for an unusual concentration on a single, rare combination.</li>
    <li>Check the geography report for traffic clustered around locations typical of data centers rather than the real markets you operate in.</li>
  </ol>

  <figure class="blog-figure">
    <svg viewBox="0 0 660 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chart of sessions throughout the day showing an unusual rise in traffic during night hours">
      <defs>
        <pattern id="hatchAmber" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#fde68a" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#ca8a04" stroke-width="2" />
        </pattern>
      </defs>
      <text x="30" y="24" font-size="13" font-weight="600" fill="#232b31">Sessions by hour of day, example pattern</text>
      <rect x="30" y="38" width="12" height="12" rx="2" fill="#16a34a" />
      <text x="48" y="48" font-size="11.5" fill="#5b6570">typical daytime traffic</text>
      <rect x="215" y="38" width="12" height="12" rx="2" fill="url(#hatchAmber)" stroke="#ca8a04" stroke-width="1.2" />
      <text x="233" y="48" font-size="11.5" fill="#5b6570">suspicious night traffic</text>
      <text x="115" y="72" text-anchor="middle" font-size="11.5" font-weight="600" fill="#ca8a04">almost as many sessions</text>
      <text x="115" y="86" text-anchor="middle" font-size="11.5" font-weight="600" fill="#ca8a04">as at midday</text>
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
      <text x="330" y="258" text-anchor="middle" font-size="11" fill="#8b939a">hour</text>
    </svg>
    <figcaption>An example pattern: sessions at 2am and 4am nearly match the midday peak, a typical footprint of bot traffic, not organic traffic.</figcaption>
  </figure>

  <h2>How to reduce bot traffic outside GA4</h2>

  <p>GA4 can structurally only ever see bots that execute JavaScript on the page the way a browser does. Any bot that queries the server directly, without rendering the page, will never show up in GA4 reports in any form, neither as "good" nor as "bad" traffic. That's a good reason not to treat GA4 as your only line of defense.</p>

  <ul>
    <li><b>Bot management at the CDN or WAF level.</b> Solutions like Cloudflare Bot Management, AWS WAF Bot Control, or similar services from other CDN providers block or challenge suspicious traffic before it ever reaches your server, rather than after the fact in analytics reports.</li>
    <li><b>Rate limiting by IP address and specific paths.</b> Limiting the number of requests per minute to login, search, or checkout effectively blunts scripted bots without affecting normal use of the site.</li>
    <li><b>CAPTCHA or a JS challenge on selected, sensitive forms.</b> Worth using sparingly, on registration, login, or a contact form, rather than on every page, so you don't degrade the experience for real users.</li>
    <li><b>Server or CDN log analysis, independent of GA4.</b> Access logs also catch bots that never execute JavaScript and structurally can never appear in any GA4 report, which is the only way to see that part of your traffic at all.</li>
    <li><b>Honeypots, links or form fields invisible to a human.</b> A real user never clicks or fills them in; a bot indexing the page automatically often does, which lets you identify and block the source IP addresses.</li>
    <li><b>A blocklist of IP addresses and ASN ranges</b>, built from recurring patterns in both your logs and GA4 together, not from a single data source.</li>
    <li><b>robots.txt, with a limited role for honest robots.</b> A robots.txt file works like a request, not a safeguard. Search engines and other honest crawlers respect it, but it won't stop anything that deliberately wants to scrape or spam your site.</li>
  </ul>

  <h2>How AlertGA4 helps with bot traffic</h2>

  <p>AlertGA4 compares the share of sessions during night hours against the typical level for a given GA4 property from previous days, every day, and sends an alert when that share suddenly rises.</p>

  <p>This isn't a blocking safeguard. It acts as an early warning that something changed and is worth checking in your server logs or bot management panel, before inflated traffic affects a campaign performance assessment or a client report.</p>

  <p>No single solution on this list is a complete answer on its own. Effective protection against bot traffic is always several layers at once: something that blocks traffic at the infrastructure level, something that limits abuse on sensitive forms, and something that checks every day whether the numbers in your analytics still look normal.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does GA4 completely block bot traffic?</summary>
      <div class="blog-faq-answer"><p>No. The default filter only recognizes bots from the IAB/ABC list based on user agent. Traffic pretending to be a regular browser passes through this filter unobstructed.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can you turn off GA4's default bot filtering?</summary>
      <div class="blog-faq-answer"><p>No, this filter always runs and there's no option to disable it. It's the only bot protection built into GA4 itself.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is VPN traffic the same thing as bot traffic?</summary>
      <div class="blog-faq-answer"><p>No. A VPN changes the visible location and sometimes the network a real user connects from, but the session can still be fully human. Judge it alongside other signals, such as duration and engagement, not the mere fact that a VPN was used.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Will adding a CAPTCHA to the homepage solve the problem?</summary>
      <div class="blog-faq-answer"><p>Usually not worth it. A CAPTCHA on every page hurts the experience for real users more than it's worth. It's better applied selectively, on the forms and flows most exposed to abuse.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How does AlertGA4 tell genuine night traffic, say from an overseas market in a different time zone, apart from a bot?</summary>
      <div class="blog-faq-answer"><p>The check compares the current share of night traffic against the typical level for that same GA4 property over previous days, so steady, genuine traffic from a different time zone simply becomes the new normal. The alert only fires on a deviation from that established normal, not on the mere fact of traffic at night.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'bot-traffic-ga4',
  plSlug: 'ruch-botowy-ga4',
  title: "Bot traffic in GA4: how to spot it and deal with it (even outside GA4)",
  excerpt: "How to spot bot traffic that got past GA4's default filter, and which solutions reduce bots before they even reach your site.",
  targetPhrase: 'bot traffic GA4',
  status: 'published',
  publishedAt: '2026-10-24',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
