import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Google Analytics 4 is today the default analytics tool for practically every website and app that runs on Google's ecosystem, but it's still often understood only on the surface: as "the new GA that replaced the old GA." That's true, but it misses the most important part: GA4 is a completely different measurement philosophy than its predecessor, Universal Analytics, built from the ground up around events rather than sessions and pageviews.</p>

  <p>This article is a comprehensive introduction to GA4: what it actually is, what it's used for, what its data model looks like, its real strengths and weaknesses, and exactly how it combines data from websites and mobile apps into one unified property. If you're implementing GA4 for the first time or sorting out your understanding after migrating from Universal Analytics, you'll find the full picture here, not just a feature list.</p>

  <h2>What is Google Analytics 4</h2>

  <p>Google Analytics 4 is the fourth and current generation of Google's free analytics tool, used to measure traffic and user behavior on websites and in mobile apps. It replaced Universal Analytics, which stopped processing new data in the summer of 2023 (with its 360 edition following a year later), which in practice forced a migration to GA4 across the entire market, whether or not a given company was ready for it.</p>

  <p>The key difference from its predecessor isn't cosmetic. Universal Analytics was built around sessions and pageviews as the basic unit of measurement. GA4 treats everything as an event: a pageview, a click, a scroll, a purchase, a login. Even a pageview itself is an event in GA4, named <i>page_view</i>, not a separate, privileged category of data. This event-based foundation has consequences for nearly every other aspect of the tool, from reporting to integrations.</p>

  <h2>What GA4 is used for</h2>

  <p>GA4 answers several different business needs at once, something that sometimes gets lost in conversations focused purely on features:</p>

  <ul>
    <li><b>Analyzing traffic and its sources.</b> Where users come from, through which channels, how many sessions and users each one generates, and how those numbers change over time.</li>
    <li><b>Measuring conversions and key events.</b> Tracking specific actions considered valuable to the business: purchases, signups, submitted forms, downloads.</li>
    <li><b>Building audiences for remarketing.</b> User groups defined based on their behavior in GA4 can be exported directly to Google Ads to target them with ads.</li>
    <li><b>Product analytics for mobile apps.</b> GA4 grew partly out of Google Analytics for Firebase, so it natively supports the events and funnels typical of apps, not just websites.</li>
    <li><b>Modeling and forecasting.</b> With enough data, GA4 provides predictive metrics such as purchase probability, churn probability, and predicted revenue from a given group of users.</li>
  </ul>

  <h2>How to use GA4 in web analytics: the event-based data model</h2>

  <p>To use GA4 effectively, you need to understand that the entire platform operates on three levels: events, event parameters, and user properties.</p>

  <ul>
    <li><b>An event</b> is a single action or occurrence you want to measure, identified by a name, e.g. <i>page_view</i>, <i>add_to_cart</i>, <i>purchase</i>. We cover in detail which events GA4 collects automatically and which you have to implement yourself in a <a href="/en/blog/ga4-automatically-collected-events">separate article on automatically collected events in GA4</a>.</li>
    <li><b>An event parameter</b> is additional information describing a specific occurrence of an event, e.g. <i>value</i> and <i>currency</i> on a purchase event, or <i>search_term</i> on a search event.</li>
    <li><b>A user property</b> is information describing the user themselves, independent of any specific event, e.g. their subscription status, preferred language, or assignment to an A/B test group, maintained across visits.</li>
  </ul>

  <p>In practice, using GA4 means first deliberately designing which events, parameters, and user properties matter for your business, and only then building reports, segments, and audiences on top of them. That's the reverse order from Universal Analytics, where some data, like pageviews or time on page, came almost for free, without needing to think through your measurement structure up front.</p>

  <h2>How to start using GA4 step by step</h2>

  <ol>
    <li>Set up a GA4 property in Google Analytics and add a data stream: Web for a website, iOS or Android for a mobile app.</li>
    <li>Implement the basic measurement tag: gtag.js or Google Tag Manager for a website, the Firebase SDK for an app.</li>
    <li>Review and fine-tune Enhanced measurement for the Web stream, following what we cover in our article on automatically collected GA4 events.</li>
    <li>Implement recommended and custom events for key business actions, using a Data Layer and Google Tag Manager if your measurement is built on that architecture.</li>
    <li>Mark the events you consider most important as key events, so they show up in conversion reports and are available as an optimization goal in Google Ads.</li>
    <li>Verify the whole implementation in DebugView before treating it as production-ready.</li>
    <li>Set a schedule for regularly checking data quality, manually or with an automated tool, instead of treating the implementation as a one-time task.</li>
  </ol>

  <h2>GA4's strengths</h2>

  <ul>
    <li><b>A shared data model for web and app.</b> One property can combine data from multiple platforms, something Universal Analytics, which required a separate tool, Firebase Analytics, for apps, never offered.</li>
    <li><b>Free export to BigQuery.</b> Even the free version of GA4 allows a daily export of raw event data to BigQuery, something Universal Analytics reserved for its paid 360 edition.</li>
    <li><b>A flexible, event-based model.</b> You can define any events and parameters you want, tailored to your specific business model, instead of being stuck with a fixed set of metrics.</li>
    <li><b>Built-in modeling and predictive metrics.</b> Purchase probability, churn probability, and predicted revenue, generated automatically once there's enough data.</li>
    <li><b>Integration with Google Ads and Consent Mode.</b> Native support for cookie consent and building advertising audiences directly, without extra middleman tools.</li>
    <li><b>Insights based on anomaly detection.</b> Automatic flagging of unusual changes in your data, covered in more detail in our <a href="/en/blog/google-analytics-4-alerts">article on alerts in GA4</a>.</li>
  </ul>

  <h2>GA4's weaknesses</h2>

  <ul>
    <li><b>A steep learning curve.</b> People used to Universal Analytics had to learn new terminology and a new way of thinking about data, which meant weeks of adjustment for many teams.</li>
    <li><b>Limited event-level data retention.</b> User and event data available for analysis in Explorations is stored for a shorter time by default than it was in Universal Analytics, 2 months as standard, up to 14 months after changing the setting.</li>
    <li><b>Data thresholds.</b> A privacy protection mechanism can hide some report rows when a user group is too small, which we cover in detail in our <a href="/en/blog/ga4-data-thresholds">article on GA4 data thresholds</a>.</li>
    <li><b>Sampling in large Explorations.</b> With very high data volume and complex queries, GA4 may base its result on a sample rather than the full dataset.</li>
    <li><b>Fewer ready-made reports out of the box.</b> Some views that were obvious in Universal Analytics require manually building your own Exploration in GA4.</li>
    <li><b>Heavy dependence on implementation quality.</b> Since most valuable business data requires deliberate event implementation, mistakes in that implementation have a bigger impact on report quality in GA4 than they did in the more automated Universal Analytics.</li>
  </ul>

  <h2>GA4's strengths and weaknesses in one table</h2>

  <table class="blog-table">
    <tr><th>Area</th><th>Strength</th><th>Weakness</th></tr>
    <tr><td>Measurement scope</td><td>A shared model for web and app</td><td>Requires deliberately designing events from scratch</td></tr>
    <tr><td>Raw data</td><td>Free export to BigQuery</td><td>Shorter data retention in the UI than in UA</td></tr>
    <tr><td>Privacy</td><td>Native integration with Consent Mode</td><td>Data thresholds can hide some report rows</td></tr>
    <tr><td>Analysis</td><td>Flexible, custom Explorations</td><td>Fewer ready-made standard reports than UA</td></tr>
    <tr><td>Data scale</td><td>Automatic insights and modeling</td><td>Sampling on very large queries</td></tr>
  </table>

  <h2>Shared data collection across Web and App</h2>

  <p>One of the biggest architectural changes compared to Universal Analytics is that a single GA4 property can collect data from multiple streams at once: a website, an iOS app, and an Android app. In Universal Analytics, measuring an app required a separate tool, Google Analytics for Firebase, with its own interface and its own reports that had to be manually reconciled with web data.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 760 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram showing how one GA4 property combines data from a Web stream, an iOS stream, and an Android stream">
      <defs>
        <marker id="arrowE" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8b939a" />
        </marker>
      </defs>

      <rect x="10" y="20" width="220" height="90" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="120" y="55" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Web stream</text>
      <text x="120" y="75" text-anchor="middle" font-size="10.5" fill="#8b939a">gtag.js / Google Tag Manager</text>

      <rect x="270" y="20" width="220" height="90" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="380" y="55" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">iOS stream</text>
      <text x="380" y="75" text-anchor="middle" font-size="10.5" fill="#8b939a">Firebase SDK</text>

      <rect x="530" y="20" width="220" height="90" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="640" y="55" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Android stream</text>
      <text x="640" y="75" text-anchor="middle" font-size="10.5" fill="#8b939a">Firebase SDK</text>

      <line x1="120" y1="110" x2="340" y2="175" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowE)" />
      <line x1="380" y1="110" x2="380" y2="175" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowE)" />
      <line x1="640" y1="110" x2="420" y2="175" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowE)" />

      <rect x="230" y="180" width="300" height="80" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="380" y="213" text-anchor="middle" font-size="13" font-weight="700" fill="#166534">One GA4 property</text>
      <text x="380" y="233" text-anchor="middle" font-size="10.5" fill="#166534">shared reports, audiences, and BigQuery export</text>
    </svg>
    <figcaption>One GA4 property can collect data from multiple streams at once, bringing web and mobile app reporting into a single place.</figcaption>
  </figure>

  <p>In practice, this means you can see the combined user count across all platforms in a single report, compare web and app user behavior side by side, and build remarketing audiences spanning both platforms at once, without manually combining exports from two separate tools.</p>

  <h2>Connecting Web and App data: what actually links them together</h2>

  <p>Simply putting Web and App streams under one GA4 property gives you a shared reporting home, but it doesn't yet answer the question of what connects a specific, individual user's data across platforms. That's a separate mechanism called Reporting Identity, configured in the property's settings (Admin, Property Settings, Reporting Identity).</p>

  <p>By default, GA4 uses <b>Blended</b> mode, which tries to identify the same user by checking sources in a fixed priority order:</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Priority order in Blended mode: User-ID, then Google Signals, then device identifier">
      <defs>
        <marker id="arrowF" markerWidth="8" markerHeight="8" refX="4" refY="7" orient="auto">
          <path d="M0,0 L8,0 L4,8 Z" fill="#8b939a" />
        </marker>
      </defs>
      <rect x="60" y="15" width="380" height="70" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="80" y="42" font-size="13" font-weight="700" fill="#166534">1. User-ID</text>
      <text x="80" y="62" font-size="10.5" fill="#166534">if your implementation sends it</text>

      <line x1="250" y1="88" x2="250" y2="112" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowF)" />

      <rect x="60" y="115" width="380" height="70" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="80" y="142" font-size="13" font-weight="700" fill="#232b31">2. Google Signals</text>
      <text x="80" y="162" font-size="10.5" fill="#8b939a">Google accounts with ads personalization turned on</text>

      <line x1="250" y1="188" x2="250" y2="212" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowF)" />

      <rect x="60" y="215" width="380" height="70" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="80" y="242" font-size="13" font-weight="700" fill="#232b31">3. Device identifier</text>
      <text x="80" y="262" font-size="10.5" fill="#8b939a">always available, separate for each platform</text>
    </svg>
    <figcaption>Blended mode only falls back to the next source once the previous one isn't available for a given user.</figcaption>
  </figure>

  <p>In other words: if you implement your own User-ID, GA4 uses it as the most reliable, deterministic link between a session on your website and a session in your app from the same person. If you don't implement it, GA4 falls back to Google Signals, aggregated, probabilistic signals from the Google accounts of signed-in users, provided they have ads personalization turned on. When neither source is available, GA4 treats the web session and the app session as two separate, unrelated users, identified only by a separate device identifier for each platform.</p>

  <p>Besides Blended mode, the Reporting Identity settings also offer <b>Observed</b> (no statistical modeling to fill in gaps) and <b>By device</b> (purely device-based, with no linking across platforms at all). Most properties stay on the default Blended mode, since it gives the fullest picture for the least configuration effort.</p>

  <h2>What is User-ID</h2>

  <p>User-ID is your own identifier, one you assign yourself, for a specific signed-in user, sent along with data to GA4 from both the website and the app. It's the only fully deterministic way to connect the same person's activity across different platforms and different devices, without relying on probabilistic modeling.</p>

  <p>A few rules to keep in mind when implementing User-ID:</p>

  <ul>
    <li><b>It has to be your own internal identifier</b>, for example the primary key of a user in your own database, not any directly identifying personal information. Google Analytics's policies explicitly prohibit sending an email address, a phone number, or any other data that could directly identify a person as the User-ID.</li>
    <li><b>It has to stay stable over time.</b> The same user should always get the same User-ID value, no matter when or from which device they log in, otherwise session linking won't work.</li>
    <li><b>You only send it after login.</b> Before a user logs in, GA4 still collects their activity, just without being able to connect it to future sessions after they log in from another device or platform, until you send a User-ID.</li>
    <li><b>Implementation differs between web and app.</b> On a website, you set it through a gtag configuration parameter or a dedicated field in the GA4 configuration tag in Google Tag Manager. In a mobile app, that's handled by the <code>setUserId()</code> method in the Firebase SDK.</li>
    <li><b>It unlocks additional reporting capabilities.</b> Beyond linking sessions, User-ID unlocks the User-ID view in reports and more accurate, less duplicated user counts, since GA4 stops counting the same person separately on every device and platform.</li>
    <li><b>It's subject to the same privacy thresholds as other dimensions.</b> Reports built on User-ID can also be subject to data thresholds, covered in our <a href="/en/blog/ga4-data-thresholds">article on GA4 data thresholds</a>, if the number of users in a given view is too small.</li>
  </ul>

  <h2>Checklist for configuring GA4 across web and app</h2>

  <figure class="blog-figure">
    <div class="blog-checklist">
      <div class="blog-checklist-head">Before you call a multi-platform setup complete</div>
      <ul class="blog-checklist-list">
        <li><span class="blog-checklist-check">✓</span> Web, iOS, and Android streams (as applicable) are connected to the same GA4 property</li>
        <li><span class="blog-checklist-check">✓</span> Event and parameter names are consistent across platforms wherever they describe the same user action</li>
        <li><span class="blog-checklist-check">✓</span> A Reporting Identity mode (Blended, Observed, or By device) has been deliberately chosen</li>
        <li><span class="blog-checklist-check">✓</span> User-ID is implemented consistently across every platform, if accurate session linking matters to you</li>
        <li><span class="blog-checklist-check">✓</span> User-ID contains no data that could directly identify a person</li>
        <li><span class="blog-checklist-check">✓</span> Key business events are marked as key events at the property level</li>
      </ul>
    </div>
  </figure>

  <h2>How AlertGA4 supports day-to-day work with GA4</h2>

  <p>Whether your GA4 property covers only a website or combines web and mobile app data, the mechanism that fails most often is the same: nobody finds out automatically when an event stops working or a parameter stops arriving. Once connected to a GA4 property, AlertGA4 checks the presence and volume of configured events and their parameter coverage every day, comparing the current day against that account's own historical norm.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-dashboard.png" alt="AlertGA4 dashboard view summarizing the status of monitored GA4 properties" width="1280" height="900" loading="lazy" />
    <figcaption>A single dashboard shows the status of every connected GA4 property, regardless of how many accounts you manage.</figcaption>
  </figure>

  <p>When something deviates from the norm, AlertGA4 sends an email with a concrete diagnosis the same day, instead of you finding out about the problem at a monthly data review.</p>

  <h2>Summary</h2>

  <p>Google Analytics 4 is more than just another version of the old tool: it's a different measurement philosophy, built on events instead of sessions, designed from the ground up to handle both websites and mobile apps in one shared property. That flexibility comes at a price, a steeper learning curve and a greater dependence on implementation quality than Universal Analytics had, but in exchange it offers capabilities its predecessor never did: free export to BigQuery, native Consent Mode integration, and a single reporting home for multiple platforms at once.</p>

  <p>Making full use of these capabilities requires deliberate decisions: which events and parameters to implement, whether and how to configure User-ID, which Reporting Identity mode to choose. None of this happens automatically, unlike many features Universal Analytics simply handed you. That difference, more than the new interface, best explains why migrating to GA4 turned out to be harder than many companies expected.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>How is GA4 different from Universal Analytics?</summary>
      <div class="blog-faq-answer"><p>Mainly in its data model. Universal Analytics was built around sessions and pageviews, while GA4 treats every interaction, including the pageview itself, as an event. GA4 also natively combines web and mobile app data in a single property, which UA never did.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is GA4 free?</summary>
      <div class="blog-faq-answer"><p>Yes, the standard version of GA4 is free, including daily data export to BigQuery. A paid GA4 360 edition also exists for large organizations, with higher limits and extra features.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Do I need to implement User-ID to use GA4?</summary>
      <div class="blog-faq-answer"><p>No, GA4 works fully without User-ID, falling back to Google Signals or the device identifier alone. User-ID is an optional but valuable addition, especially if your business has a login and you care about accurately connecting the same user's activity across platforms.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can I use a user's email address as the User-ID?</summary>
      <div class="blog-faq-answer"><p>No. Google Analytics's policies prohibit sending any data that could directly identify a person as the User-ID, including an email address. It should be your own internal identifier, for example a user's key from your database.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Do web and app data in GA4 connect automatically with no configuration at all?</summary>
      <div class="blog-faq-answer"><p>Streams flow into shared reports automatically once connected to one property. Linking a specific user's activity across platforms, though, depends on the Reporting Identity mode and on whether User-ID has been implemented, it doesn't happen fully automatically with no settings involved.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Which Reporting Identity mode is best?</summary>
      <div class="blog-faq-answer"><p>For most properties, the default Blended mode is a good choice, since it uses the best source available in each situation. By device mode makes sense mainly where legal or business reasons require deliberately opting out of linking data across devices.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'google-analytics-4-guide',
  plSlug: 'google-analytics-4-przewodnik',
  title: 'Google Analytics 4: The Complete Guide to the Platform, Its Strengths, and Its Limitations',
  excerpt: 'What GA4 is, what it’s used for, its strengths and weaknesses, how it connects web and mobile app data, and exactly what User-ID is.',
  targetPhrase: 'Google Analytics 4 guide',
  status: 'published',
  publishedAt: '2026-11-10',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
