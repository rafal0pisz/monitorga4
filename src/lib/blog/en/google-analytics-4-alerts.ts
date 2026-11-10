import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Companies often assume that since GA4 already collects traffic and conversion data, it must also tell you when something in that data starts breaking. GA4 does have a mechanism for this: Insights.</p>

  <p>This article covers what it is, how to set it up, where its limits are, and how it differs from everyday, automated monitoring like AlertGA4.</p>

  <h2>What alerts in Google Analytics 4 actually are</h2>

  <p>Universal Analytics, GA4's predecessor, had a feature called Custom Alerts: you defined a threshold for a chosen metric, and the system emailed you when it was crossed. GA4 has no feature with the same name or the same behavior. Instead, it has an Insights panel, available under the bell icon in the top right corner of every report.</p>

  <p>Insights come in two kinds. The first is automatic insights, which GA4 generates on its own using internal statistical models that continuously analyze the account's data. An automatic insight might flag a sudden jump in sessions from a specific country, or a drop in conversions in one channel, with zero configuration on your part.</p>

  <p>The second kind is custom insights. You define these yourself: pick a metric to watch, an optional dimension, a trigger condition (for example, a drop of more than 20 percent versus the previous week), and a check frequency.</p>

  <p>Either way, the notification lands in the Insights panel inside GA4's interface, and some insights get emailed too.</p>

  <p>The difference versus dedicated data-quality monitoring isn't whether an email exists at all, it's what it's about: an insight operates on general metrics like sessions, users, or conversions, and never drills down to a specific event, parameter, or transaction.</p>

  <p>That difference comes straight from how Google rebuilt its whole approach to analytics when moving from Universal Analytics to GA4. Universal Analytics was built around sessions and pageviews, and Custom Alerts worked on simple, user-defined numeric thresholds.</p>

  <p>GA4 is built around events and machine learning models, so Google replaced simple thresholds with a mechanism based on detecting statistical anomalies. That approach can be sharper at catching genuinely unusual swings, but it's worse at watching for specific, known business rules, exactly the kind the old Custom Alerts were built for.</p>

  <h2>How to use alerts in GA4</h2>

  <ol>
    <li>Open any report in GA4 and click the bell icon in the top right corner. The Insights panel opens with a list of automatic observations already generated.</li>
    <li>Review the automatic insights. Each one describes a single observed change along with how far it deviates from that metric's typical range.</li>
    <li>To add your own rule, click the button for creating a new insight in that same panel.</li>
    <li>Pick the metric to watch, for example sessions, revenue, or conversion count, and optionally a dimension to break it down by: country, channel, device, or campaign.</li>
    <li>Set the trigger condition: an increase or decrease by a given percentage or absolute value, relative to a comparison period you choose.</li>
    <li>Pick a check frequency, usually daily or weekly, and save the rule.</li>
    <li>GA4 checks the rule on that cycle and reports matches in the Insights panel, with no further action needed from you.</li>
  </ol>

  <p>For accounts linked to Google Ads, some insights about paid traffic can also surface in the campaign interface, independently of the GA4 panel.</p>

  <p>In practice, the most value comes from combining a handful of automatic insights with a few custom rules on the metrics that matter most to you: revenue, lead volume, key acquisition channels. The more rules you try to maintain by hand, the easier it is for one of them to quietly go stale after an offer or campaign changes, with nobody noticing.</p>

  <p>For example, an online store might set an insight watching for a revenue drop of more than 15 percent day over day, and a second one watching for a cart abandonment rate increase of more than 10 percentage points week over week. Both work well as long as someone remembers they exist and checks the Insights panel regularly to see if either has fired.</p>

  <h2>Where alerts in GA4 fall short</h2>

  <p>Insights is a real, working feature, but it has a few limitations worth knowing before you assume it fully covers data-quality monitoring.</p>

  <ul>
    <li><b>An insight shows a general metric, not a specific event or parameter.</b> An insight email might tell you sessions, users, or conversions dropped, but it won't say whether the cause is self-referral, a duplicate purchase, night-time bot traffic, or a missing parameter on a purchase event. That's the biggest difference versus checks built for specific, known measurement problems: both mechanisms can send an email, but at a completely different level of detail.</li>
    <li><b>You have to come up with the rules yourself.</b> GA4 has no ready-made, predefined checks for specific, known measurement problems: self-referral, duplicate purchase events, night-time bot traffic, a high share of "(not set)" in traffic source. To catch one of these with an insight, you first need to know it can happen at all, then build a rule for it yourself on top of one of the available general metrics.</li>
    <li><b>Email notifications only work in a limited way.</b> Insights are mainly visible inside the GA4 interface itself. Email notification is available, but not for every insight type, and not as reliably as Custom Alerts used to work in Universal Analytics.</li>
    <li><b>The number of custom insights per property is capped.</b> You can't monitor an unlimited number of rules at once on a single GA4 property, so you have to pick what matters most.</li>
    <li><b>Every property has its own panel.</b> With several or dozens of clients, typical for an agency, that means opening each GA4 property individually, with no single combined view across every account at once.</li>
    <li><b>Insights don't cover parameter or e-commerce event coverage.</b> The mechanism operates on GA4's ready-made, general metrics and won't check whether the <i>currency</i> parameter actually arrives with the <i>purchase</i> event, or whether the e-commerce funnel is missing a <i>begin_checkout</i> event.</li>
    <li><b>Only the person signed into that specific Google account sees the notification.</b> Insights has no built-in way to broadcast the information to a whole team or to a client whose account you manage. For anyone else to find out, you have to pass it along manually.</li>
  </ul>

  <p>None of these limitations make Insights useless, it's still a real alerting mechanism that can land in your inbox.</p>

  <p>The problem shows up when a company treats this general level as a complete monitoring system and stops looking for something that drills down to specific events and parameters, even though that's exactly where most real, costly measurement errors in GA4 hide.</p>

  <h2>AlertGA4: dedicated alerts built for GA4's specific, known problems</h2>

  <p>AlertGA4 doesn't replace Insights in GA4. It fills in exactly where the built-in mechanism stops.</p>

  <p>Instead of designing your own statistical rules, once you connect a GA4 property you immediately get a full set of ready-made checks built for real, known measurement problems:</p>

  <ul>
    <li>self-referral and lost channel attribution,</li>
    <li>duplicate purchase events inflating revenue,</li>
    <li>night-time bot traffic,</li>
    <li>the share of "(not set)" in source, medium, and landing page,</li>
    <li>geographic anomalies and unusual traffic from new countries,</li>
    <li>coverage of standard and custom parameters,</li>
    <li>completeness of custom and e-commerce events.</li>
  </ul>

  <p>Every monitored property is checked automatically, once a day, with no need to open any panel by hand. Each check's result lands on a dashboard with an overall data-quality score for that property and a trend against previous days.</p>

  <figure class="blog-figure">
    <a href="/blog/alertga4-dashboard.png" target="_blank" rel="noopener" class="blog-figure-zoom"><img src="/blog/alertga4-dashboard.png" alt="AlertGA4 dashboard with a list of monitored projects and their data-quality scores" width="1280" height="900" loading="lazy" /></a>
    <figcaption>AlertGA4's dashboard: every monitored GA4 property with its current score and trend in one place.</figcaption>
  </figure>

  <p>When a check detects a problem, you get an email with a specific diagnosis: which exact metric failed, what value it has, and how it changed versus the previous period. That's the real difference versus a plain insight: instead of "something changed", you get something like "self-referral rose to 3.2 percent of sessions, up from 0.3 percent a week earlier".</p>

  <figure class="blog-figure">
    <a href="/blog/alertga4-checks.png" target="_blank" rel="noopener" class="blog-figure-zoom"><img src="/blog/alertga4-checks.png" alt="AlertGA4's checks view for a single project, with Pass, Warn, and Fail results" width="1280" height="900" loading="lazy" /></a>
    <figcaption>The checks view for a single project: every metric with its value, change versus the previous period, and status.</figcaption>
  </figure>

  <p>You can also set up a separate, critical alert channel: pick specific metrics and a separate email address that only gets notified when those particular metrics show a problem, independent of the project's overall score.</p>

  <p>For accounts managing several GA4 properties, typical for agencies, AlertGA4 shows every monitored project on a single dashboard, with a current score and trend next to each one, instead of opening each property individually. You can invite a team to collaborate on the account without sharing passwords.</p>

  <p>If you don't want a daily email, you can switch to getting a message only on days when a warning or failure actually shows up, instead of a message every day regardless of the result.</p>

  <p>Setting up a new project doesn't require typing event or parameter names from memory. The setup wizard reads real data from the connected GA4 property and suggests which events and parameters are worth monitoring, along with their volume over the last 30 days.</p>

  <p>Beyond the daily, automatic check, there's also a manual "Run now" button, useful right after you've fixed a problem, when you don't want to wait until the next day to confirm it's actually gone.</p>

  <h2>Insights in GA4 versus AlertGA4: a comparison</h2>

  <p>Insights in GA4 is a real alerting feature that can also land in your inbox, it isn't some made-up capability.</p>

  <p>The difference versus AlertGA4 isn't whether a notification exists at all, it's what level of detail it operates at: GA4 tells you about general statistics like sessions, users, or conversions, while AlertGA4 drills down to specific events, parameters, and transactions.</p>

  <table class="blog-table">
    <tr><th>Feature</th><th>Insights in GA4</th><th>AlertGA4</th></tr>
    <tr><td>Is it an email alert at all</td><td>Yes, but only for some insight types and in a limited way</td><td>Yes, daily or only when there's a problem</td></tr>
    <tr><td>Level of detail</td><td>General stats: sessions, users, conversions</td><td>Specific events and parameters: self-referral, duplicate purchases, "(not set)", parameter coverage</td></tr>
    <tr><td>Ready-made rules for known problems (self-referral, duplicates, bots, "(not set)")</td><td>No, you have to define your own rule on a general metric</td><td>Yes, right after connecting the property</td></tr>
    <tr><td>Checks parameter and e-commerce event coverage</td><td>No</td><td>Yes</td></tr>
    <tr><td>One view across multiple properties and clients</td><td>No, each property on its own</td><td>Yes, a single dashboard</td></tr>
    <tr><td>Separate alert for selected, critical metrics</td><td>Yes, but at the level of a general metric</td><td>Yes, at the level of a specific check</td></tr>
    <tr><td>Time to set up your first alert</td><td>You have to pick the metric, threshold, and frequency yourself</td><td>A setup wizard suggests one based on real data from the property</td></tr>
    <tr><td>Cost</td><td>Included in GA4, free</td><td>Paid subscription, starting from the Lite plan</td></tr>
  </table>

  <h2>How to combine both</h2>

  <p>Insights in GA4 and AlertGA4 aren't mutually exclusive. You get the most out of using them together.</p>

  <ol>
    <li>Keep automatic insights enabled in GA4 as a general, free mechanism for catching unusual changes in any metric.</li>
    <li>Connect the GA4 property to AlertGA4 to check, every day, for the specific, known sources of measurement error that Insights doesn't cover.</li>
    <li>Set up an address for the daily alert and, if needed, a separate critical channel for selected metrics.</li>
    <li>Every so often, still check the Insights panel in GA4 directly, especially after major changes to campaigns, offers, or the site itself.</li>
  </ol>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does AlertGA4 replace Insights in GA4?</summary>
      <div class="blog-faq-answer"><p>No, and that isn't the goal. Insights in GA4 is a general statistical-anomaly detector, free and built into GA4 itself. AlertGA4 adds a layer of ready-made, specific checks for known measurement problems that Insights doesn't cover, plus a reliable daily email with a diagnosis.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is it worth using both at once?</summary>
      <div class="blog-faq-answer"><p>Yes. Insights in GA4 still makes sense as a general, free mechanism for catching unusual changes in any metric you define yourself. AlertGA4 keeps watch in the background for specific, known sources of measurement error that are easy to miss when you're only looking at general metrics.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Do you need a statistics background to set up alerts in GA4?</summary>
      <div class="blog-faq-answer"><p>For custom insights in GA4, yes, you have to pick the metric, threshold, and frequency yourself. In AlertGA4, the checks are already defined, and the setup wizard suggests what else is worth monitoring based on real data from your property.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How long does setting up AlertGA4 take?</summary>
      <div class="blog-faq-answer"><p>Connecting one GA4 property and going through the setup wizard usually takes a few minutes. Daily checks and alert emails start working as soon as you save the configuration, with no further work on your end.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What if I manage a dozen or more GA4 properties for different clients?</summary>
      <div class="blog-faq-answer"><p>The Agency plan lets you monitor up to a hundred GA4 properties from a single account, with one dashboard showing every project at once, and the ability to invite a team to collaborate without sharing passwords.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does AlertGA4 require changes to the site's code or to GA4's configuration?</summary>
      <div class="blog-faq-answer"><p>No. Connecting a property happens through standard Google sign-in and read-only access to GA4 data. AlertGA4 only reads data GA4 already collects, and changes nothing in the property's configuration or in the site's own tracking code.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'google-analytics-4-alerts',
  plSlug: 'alerty-w-google-analytics-4',
  title: "Alerts in Google Analytics 4: what they can and can't do",
  excerpt: 'What Insights in GA4 is, how to set it up, where its limits are, and how it differs from everyday monitoring with AlertGA4.',
  targetPhrase: 'GA4 alerts',
  status: 'published',
  publishedAt: '2026-10-19',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
