import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Before you start monitoring an event for weeks and months, you first need to be sure it actually works correctly from the start. That's what verification is: a one-time, thorough check of a specific implementation, usually right after you roll out a new event or make a change to the site.</p>

  <p>This guide covers which tools to use for verification, how to work through it step by step, and which details are easy to overlook on a quick glance.</p>

  <h2>Verification vs. monitoring: two different jobs</h2>

  <p>Verification answers one question: does this specific event I just implemented work correctly, right here and now, on my test device. Monitoring answers a different question: does that same event still work correctly a week, a month, six months later, for every user, not just you.</p>

  <p>Both are necessary, but neither replaces the other. A thorough verification at launch is worthless if nobody later checks whether the event still works after the next site update. That's why this article focuses purely on verification, and we've given <a href="/en/blog/ga4-event-monitoring">ongoing event monitoring</a> its own separate piece.</p>

  <h2>Tools for verifying events in GA4</h2>

  <ul>
    <li><b>DebugView in GA4.</b> Shows a detailed, chronological event stream from a single, marked test device, together with the full parameter list for each event. This is the core verification tool, because it shows exactly what GA4 actually received.</li>
    <li><b>GTM Preview mode.</b> Shows which tags, triggers, and variables fired for a specific interaction on the page, before the data even reaches GA4. It lets you catch a trigger misconfiguration before it becomes a data bug.</li>
    <li><b>The Tag Assistant extension.</b> An additional layer of verification at the whole-page level, showing every Google tag detected on a given page, not just the ones tied to a specific event.</li>
    <li><b>The Realtime report.</b> Less detailed than DebugView, but useful for a quick confirmation that an event arrived at all, without having to mark a device for debugging.</li>
    <li><b>The Network tab in browser developer tools.</b> Shows the raw request sent to Google's servers, together with the exact parameter list in the request URL. Useful when DebugView isn't showing an event for some reason and you need to figure out whether the problem is on the sending side or the receiving side.</li>
  </ul>

  <h2>How to verify an event step by step</h2>

  <ol>
    <li>Turn on debug mode: install the Google Analytics Debugger extension, add a <i>debug_mode</i> parameter in your tag configuration, or use Preview mode directly in GTM.</li>
    <li>Open DebugView in GA4 and confirm your test device shows up in the list of active debuggers.</li>
    <li>Perform the exact action on the site that the event is supposed to record: add a product to the cart, submit a form, complete a test order.</li>
    <li>Check in DebugView whether the event showed up at all, within a reasonable time after performing the action.</li>
    <li>Expand the event's details and compare the parameter list against what should actually be sent.</li>
    <li>Repeat the same action again to check whether the event fires more than once each time.</li>
    <li>If something doesn't match in DebugView, go back to GTM Preview and check which trigger and which variable are responsible for the element in question.</li>
  </ol>

  <h2>What to look out for during verification</h2>

  <ul>
    <li><b>The exact event name.</b> GA4 is case sensitive and treats <i>add_to_cart</i> and <i>addToCart</i> as two completely different events, not variants of the same name.</li>
    <li><b>The data type of parameters.</b> A numeric parameter sent as a quoted string can end up correctly recorded but incorrectly summed in reports based on numeric metrics.</li>
    <li><b>Values that shouldn't be blank.</b> A <i>currency</i> parameter on a purchase event or an <i>item_id</i> on e-commerce events, present in the event structure but without an actual value, is a common, easy-to-miss defect.</li>
    <li><b>The order of events in a longer process.</b> When verifying an entire purchase funnel, check that events appear in the right order: first <i>view_item</i>, then <i>add_to_cart</i>, then <i>begin_checkout</i>, finally <i>purchase</i>.</li>
    <li><b>No duplicates for a single user action.</b> One button click should generate exactly one event, not two or three fired by redundant triggers in the same GTM container.</li>
    <li><b>Correct user properties, if you're using them.</b> User properties set at login or sign-up are easy to overlook during verification focused purely on the event itself.</li>
  </ul>

  <h2>The most common bugs caught during verification</h2>

  <ol>
    <li><b>A typo in the event or parameter name.</b> One wrong letter in a name makes GA4 record a completely new, unrelated event instead of the intended one.</li>
    <li><b>Inconsistent naming conventions.</b> Some events in <i>snake_case</i>, some in <i>camelCase</i>, implemented by different people at different times, makes building consistent reports harder later.</li>
    <li><b>A parameter sent as an empty string instead of a real value.</b> This happens when a GTM variable tries to read a value from the page before that value has finished loading.</li>
    <li><b>An event firing multiple times for a single interaction.</b> A typical result of two overlapping triggers or broken event handling in a single-page application.</li>
    <li><b>A missing <i>item_id</i> or <i>item_name</i> on e-commerce events.</b> The event records correctly at a general level, but there's no way to break the result down by specific product.</li>
  </ol>

  <h2>How AlertGA4 complements manual verification</h2>

  <p>Manual verification in DebugView checks one test device at one moment in time. It won't tell you whether that same event still works correctly for every user a week later, after a site update you happened not to test by hand.</p>

  <p>AlertGA4 takes over this part of the process once verification is done: it checks the presence, volume, and parameter coverage of configured events every day, on real production traffic, not a single test device. If something that passed manual verification at launch stops working a month later, you get an email about it the same day.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does DebugView show data in real time?</summary>
      <div class="blog-faq-answer"><p>Yes, events from a device marked for debugging show up in DebugView almost instantly, usually within a few to a dozen seconds of being sent.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Do I need to be a developer to verify an event in GA4?</summary>
      <div class="blog-faq-answer"><p>No. DebugView, GTM Preview, and the Tag Assistant extension are designed to be used without writing any code. A basic understanding of event and parameter structure helps, but programming knowledge isn't required.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is verification on one device enough?</summary>
      <div class="blog-faq-answer"><p>It's enough to confirm the implementation works correctly in the intended scenario. It isn't enough to make sure it works the same way across every browser, device, and network condition, which is why it's worth pairing with continuous monitoring on real traffic.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What if an event doesn't show up in DebugView at all?</summary>
      <div class="blog-faq-answer"><p>Check GTM Preview first to see whether the trigger fired at all. If it did, and the event still isn't showing up in DebugView, check the Network tab in your browser's developer tools to see whether the request was even sent to Google's servers.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does verification need to be repeated after every site change?</summary>
      <div class="blog-faq-answer"><p>For any change touching an element a GTM trigger depends on, definitely yes. That's the most common moment when a previously working event quietly stops firing.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-event-verification',
  plSlug: 'weryfikacja-zdarzen-ga4',
  title: 'GA4 event verification: a complete step-by-step guide',
  excerpt: 'How to check whether an event in GA4 actually works correctly: DebugView, GTM Preview, and what to watch for during verification.',
  targetPhrase: 'GA4 event verification',
  status: 'published',
  publishedAt: '2026-11-05',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
