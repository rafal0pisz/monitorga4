import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Events are the foundation of GA4. Conversions, audience segments, e-commerce reports, funnels, all of it is built on top of events that your website or app sends to GA4. If one of them stops working, you won't find out from the GA4 interface itself, because GA4 doesn't warn you that something is missing. It simply doesn't show what it never received.</p>

  <p>Event monitoring is the process of regularly checking whether the events your analytics depend on are actually arriving in GA4, in the expected volume and with the correct parameters. This article covers what that looks like in practice, which methods are available, and why doing it once, at launch, isn't enough.</p>

  <h2>What event monitoring in GA4 actually means</h2>

  <p>Every interaction GA4 records is an event: a page view, a button click, adding a product to a cart, placing an order, submitting a form. GA4 doesn't automatically distinguish important events from unimportant ones. You decide which ones to mark as key events and which to watch most closely.</p>

  <p>In practice, event monitoring answers three questions, asked regularly, not just once: does a given event show up at all, does it show up in the expected volume, and does it arrive with the full set of parameters you need for further analysis. Failing to answer any of these means part of the reports you're looking at rest on incomplete or stale data, with no warning in the interface.</p>

  <h2>Why events stop working without any error message</h2>

  <p>GA4 doesn't send a notification when an event stops being sent. From GA4's point of view, nothing happens, because GA4 only sees what actually arrives. An event that stops existing simply disappears from reports, usually unnoticed for weeks.</p>

  <ul>
    <li><b>A site change without a matching GTM update.</b> The product team changes the page structure, a CSS class name, or the ID of an element a GTM trigger depends on, and the tag stops firing with no warning on the frontend side.</li>
    <li><b>A parameter or event name change on the dataLayer side.</b> A developer renames an event from <i>add_to_cart</i> to <i>addToCart</i> during a refactor, not realizing GTM is listening for exactly the old name.</li>
    <li><b>Hitting the custom event or parameter limit per property.</b> GA4 caps the number of unique event and parameter names recorded per property; once you exceed it, new, excess names stop being fully reported.</li>
    <li><b>An expired or removed tag in the GTM container.</b> Cleaning up a GTM container, common when handing an account between agencies, sometimes removes a tag that was still actively in use.</li>
    <li><b>A Consent Mode change.</b> Updating a cookie consent banner can change the default consent state for measurement, limiting or modeling part of your events with no clear signal of how big that limitation actually is.</li>
    <li><b>An e-commerce platform or CMS migration.</b> Moving a store to a new platform usually means a new data layer implementation, and old GTM triggers, built for the old structure, have nothing left to listen to.</li>
  </ul>

  <h2>Monitoring methods: manual and automated</h2>

  <p>You have several layers of monitoring to choose from, ranging from fully manual to fully automated. In practice, the most effective teams combine them instead of relying on just one.</p>

  <ul>
    <li><b>The Realtime report.</b> Shows events from the last few minutes. Good for a quick confirmation that something is arriving right now, poor at catching a slow, gradual volume decline spread across days.</li>
    <li><b>DebugView.</b> Shows a detailed event stream from a single, marked test device, together with the full parameter list for each event. Great for verifying a specific implementation, but it requires manual setup and isn't suited to continuous oversight.</li>
    <li><b>Standard GA4 reports.</b> Show aggregated data, usually with a processing delay of somewhere between a dozen and twenty-four hours. Good for checking volume trends over time, but they require someone to actually check them regularly and remember what a normal level looks like.</li>
    <li><b>Explorations.</b> Let you build your own, freeform breakdown, for example event counts day by day split by event name, which makes it easier to spot the day volume suddenly dropped by hand.</li>
    <li><b>Automated monitoring tools.</b> Check a defined set of events on a cycle, with no human involved, and only notify you when something actually deviates from normal. The difference from the previous methods is fundamental: nobody has to remember to check.</li>
  </ul>

  <h2>What good event monitoring should cover</h2>

  <ul>
    <li><b>The presence of expected events every day.</b> A key event that didn't appear a single time over an entire day is one of the most reliable signals of a technical failure, and one of the easiest to miss in a monthly total.</li>
    <li><b>Volume against a typical baseline, not a fixed number.</b> A 40 percent drop compared to the same day a week earlier tells you more than a comparison to an arbitrarily chosen number.</li>
    <li><b>Parameter coverage, not just the event itself.</b> A <i>purchase</i> event without a <i>currency</i> or <i>transaction_id</i> parameter technically exists in GA4, but it's practically useless for reliable revenue analysis.</li>
    <li><b>The order of events in the e-commerce funnel.</b> A count of <i>begin_checkout</i> events noticeably higher than <i>view_item</i> usually signals a measurement bug, not real user behavior.</li>
    <li><b>Custom events specific to your business.</b> A contact form, a newsletter signup, a pricing sheet download, each one needs its own watch, because none of them is monitored by GA4 by default.</li>
  </ul>

  <h2>How to set up event monitoring step by step</h2>

  <ol>
    <li>Make a list of the events that are key to your business: purchases, leads, signups, key funnel steps.</li>
    <li>For each one, establish what volume is normal on a typical day or week, based on historical GA4 data.</li>
    <li>Decide which parameters on each event are essential for further analysis, and note them down alongside the event name.</li>
    <li>Set a schedule for manual checking if you aren't using an automated tool yet, ideally daily or every few days, not once a month.</li>
    <li>If you manage more than one GA4 property, consider an automated tool from the start, since manually checking several accounts at once stops scaling fast.</li>
    <li>Document who's responsible for reacting when monitoring catches something, so an alert doesn't land in a void.</li>
  </ol>

  <h2>How AlertGA4 automates event monitoring</h2>

  <p>Once you connect a GA4 property, AlertGA4 checks the presence and volume of configured events every day, comparing them against previous days on the same property. The setup wizard reads real data from your account and suggests which events are worth monitoring, along with their volume over the last 30 days, instead of making you type names in from memory.</p>

  <figure class="blog-figure">
    <img src="/blog/alertga4-checks.png" alt="AlertGA4 checks view with a list of monitored events and their status" width="1280" height="900" loading="lazy" />
    <figcaption>Every monitored event has its own status, current volume, and change against the previous period.</figcaption>
  </figure>

  <p>Beyond an event's mere presence, AlertGA4 also checks its parameter coverage and, for e-commerce events, the completeness of the whole funnel. When something deviates from normal, you get an email with a specific diagnosis the same day, instead of finding out at the next monthly review.</p>

  <p>Event monitoring isn't a one-time task to check off at GA4 launch. It's a process that only makes sense when it runs continuously, because events can stop working months after launch, triggered by a completely unrelated change elsewhere on the site.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>What's the difference between event monitoring and event verification?</summary>
      <div class="blog-faq-answer"><p>Verification is a one-time or ad hoc check that a specific event works correctly, usually right after launch. Monitoring is a continuous, repeated process of watching whether those same events still work correctly a week and a month later. We cover verification itself in a <a href="/en/blog/ga4-event-verification">separate guide</a>.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does GA4 warn you when an event stops being sent?</summary>
      <div class="blog-faq-answer"><p>No. GA4 has no mechanism for flagging the absence of an event that used to appear. An event that stops being sent simply disappears from reports with no message at all.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How often should you check events manually?</summary>
      <div class="blog-faq-answer"><p>For manual checks, daily or every few days is best for key events. Once a month is usually too rare, since an outage lasting several weeks can significantly distort an entire reporting period before anyone notices it.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is it worth monitoring every event, or just a select few?</summary>
      <div class="blog-faq-answer"><p>It's usually better to focus on a handful to a dozen events that are genuinely key to the business than to try to watch every single event GA4 records. Too broad a scope dilutes attention and makes it harder to quickly recognize which alert actually matters.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does event monitoring require programmatic access to the GA4 Data API?</summary>
      <div class="blog-faq-answer"><p>It doesn't have to. Manual checking in the GA4 interface requires no programming knowledge at all, and ready-made tools like AlertGA4 automate it without you needing to write your own Data API queries.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-event-monitoring',
  plSlug: 'monitoring-zdarzen-ga4',
  title: 'GA4 event monitoring: how to do it and why it matters',
  excerpt: 'What event monitoring in GA4 actually is, which methods are available (manual and automated), and what happens when nobody keeps watch.',
  targetPhrase: 'GA4 event monitoring',
  status: 'published',
  publishedAt: '2026-11-05',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
