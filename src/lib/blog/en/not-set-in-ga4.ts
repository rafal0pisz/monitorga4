import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>"(not set)" in GA4 can show up in practically any report: in traffic source, in channel, in landing page, in product category, or in a custom dimension. Some of this is natural and can't be eliminated down to zero.</p>

  <p>The problem starts when the share of "(not set)" grows month over month or suddenly jumps, because at that point it almost always means a real measurement bug, not just statistical noise.</p>

  <h2>What "(not set)" actually is in GA4</h2>

  <p>"(not set)" is the label GA4 shows when an event has no value assigned for a specific dimension in a report. GA4 registered the event, the session, the custom event, the purchase, but the particular dimension you happen to be grouping data by had no value to show for that event.</p>

  <p>That's an important distinction from "missing data": the event itself reached GA4 correctly, it's just that one of the attributes attached to it is empty or wasn't read.</p>

  <h2>Where "(not set)" shows up most often</h2>

  <ul>
    <li><b>Landing page.</b> Happens with unusual redirects, or when the page parameter hasn't finished loading before the event is sent.</li>
    <li><b>Country and city.</b> GA4 can't always geolocate an IP address, especially with traffic from VPNs, corporate proxies, or some bot traffic.</li>
    <li><b>Product name, product category, and other e-commerce dimensions.</b> Shows up when a product parameter (item_name, item_category) wasn't sent with the event, even though the e-commerce event itself arrived.</li>
    <li><b>Custom dimensions.</b> A very common cause: the event parameter is being sent correctly, but the custom dimension built on it was never registered in GA4's settings, and historical data from before that registration will always show "(not set)".</li>
  </ul>

  <h2>The most common causes</h2>

  <ol>
    <li><b>This is not the same thing as missing UTMs. That's a separate issue.</b> A common myth: traffic with no campaign parameters and no referrer ends up as "(not set)". In reality, GA4 classifies that traffic as Direct, "(direct)/(none)", a deliberate, valid value, not missing data. If you want to reduce the share of Direct traffic, adding UTMs to the links you control helps, but that's a separate task, unrelated to "(not set)".</li>
    <li><b>Broken session continuity with cross-domain measurement.</b> If the checkout flow passes through another domain (for example an external payment gateway) without properly configured domain linking, GA4 can lose session data on the way back to the main domain. Subsequent events then arrive with "(not set)" in source/medium.</li>
    <li><b>Events sent via the Measurement Protocol or a server-side integration with no browser session data.</b> Events sent directly from the backend, such as confirming an order placed by phone or importing offline conversions, have no associated browser session, so GA4 has nowhere to pull a traffic source from.</li>
    <li><b>A custom event fired in GTM before GA4 has established a session.</b> The wrong trigger order, an event firing before the GA4 configuration tag, can cause it to arrive with no session context.</li>
    <li><b>A custom dimension registered after data already started flowing in.</b> GA4 doesn't retroactively recalculate "(not set)" into the actual parameter value for events that predate registering the custom dimension in the admin panel.</li>
    <li><b>Variable load order in GTM.</b> If a tag sends an event before a variable holding the parameter value has been set (for example through an asynchronous product data fetch), the parameter arrives empty.</li>
    <li><b>Consent Mode and limited signal.</b> Without consent for certain cookie categories, some signals get modeled or restricted, which can increase the share of missing values in some dimensions.</li>
  </ol>

  <h2>How to check the scale of the problem</h2>

  <ul>
    <li>In the acquisition report, add a secondary dimension and check what percentage of sessions over the last 30 days show "(not set)" in source/medium. Treat that as a baseline for future comparisons.</li>
    <li>For custom dimensions, check in Admin, Custom definitions, when a given dimension was actually registered. "(not set)" from before that date is expected and doesn't need fixing.</li>
    <li>Break down the share of "(not set)" by device and traffic source. A spike limited to a single channel (for example an email campaign) usually points to one specific, easy-to-fix spot rather than a general measurement problem.</li>
  </ul>

  <h2>How to reduce "(not set)" step by step</h2>

  <ol>
    <li>Configure cross-domain measurement in your GA4 data stream settings if the purchase flow passes through an external payment domain. This is the most common cause of "(not set)" in source/medium.</li>
    <li>If you send events via the Measurement Protocol or a server-side integration, include session data (client_id, session_id) with them instead of sending the event detached from the browser session.</li>
    <li>In GTM, check your trigger order. Custom events should fire after the GA4 configuration tag, not before it.</li>
    <li>Register missing custom dimensions in Admin, Custom definitions, as soon as possible after deploying a new parameter in GTM. Every day of delay is a day of data that can never be recovered.</li>
    <li>In GTM, check the timing of variable resolution relative to the tag trigger, and delay the event if needed until the parameter value is actually available.</li>
    <li>Set a realistic acceptable threshold for "(not set)" for your industry and traffic, usually a few percent, rather than aiming for zero. Some of this comes from browser and user privacy limitations, not a configuration bug.</li>
    <li>Monitor the share of "(not set)" continuously, not just once right after deploying a fix. A new integration or a GTM change can quietly push it back up.</li>
  </ol>

  <h2>How AlertGA4 monitors "(not set)"</h2>

  <p>AlertGA4 checks the share of "(not set)" every day across key dimensions, source/medium, landing page, and selected custom dimensions, and compares it against previous days.</p>

  <p>When the share crosses a set threshold or suddenly jumps compared to its typical level, you get an email with the exact value and the percentage change, instead of having to periodically check the same report in the GA4 interface by hand.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Can "(not set)" be completely eliminated in GA4?</summary>
      <div class="blog-faq-answer"><p>Not entirely. Some direct traffic, some geolocation gaps, and some signals limited by privacy settings will always end up without a value for certain dimensions. The goal is to reduce the part that comes from configuration bugs, not to reach zero.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What level of "(not set)" is considered normal?</summary>
      <div class="blog-faq-answer"><p>It depends on your industry and traffic sources, but a few percent of sessions showing "(not set)" in source/medium usually isn't cause for concern. The warning sign isn't the level itself, it's a sudden rise above your established baseline.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does "(not set)" always mean a GTM bug?</summary>
      <div class="blog-faq-answer"><p>Not always. It can come from broken session continuity with cross-domain measurement, events sent via the Measurement Protocol with no session data, cookie consent mode, or an unregistered custom dimension. Breaking it down by event source and device is what actually shows which cause dominates. Importantly, this is different from traffic with no UTMs, which GA4 classifies as Direct, not "(not set)".</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Will registering a custom dimension fix historical data?</summary>
      <div class="blog-faq-answer"><p>No. GA4 doesn't recalculate events from before a custom dimension was registered. They'll permanently show "(not set)" for that dimension. That's why it's worth registering new dimensions right after deploying a new parameter in GTM.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How does AlertGA4 decide the threshold for sending an alert?</summary>
      <div class="blog-faq-answer"><p>The check compares the current share of "(not set)" in a given dimension against its typical level from previous days for that same GA4 property, so the threshold is tailored to that specific account's real pattern, not one fixed number for everyone.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'not-set-in-ga4',
  plSlug: 'not-set-ga4',
  title: 'Why You\'re Seeing "(not set)" in GA4 and How to Fix It Step by Step',
  excerpt: 'The most common sources of "(not set)" in source, channel, and landing page, and how to reduce how often it shows up.',
  targetPhrase: '(not set) in GA4',
  status: 'published',
  publishedAt: '2026-10-19',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
