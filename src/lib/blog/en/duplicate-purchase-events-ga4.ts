import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Revenue is one of the GA4 metrics people look at most often and scrutinize least. After all, GA4 is just supposed to count what actually sold.</p>

  <p>The problem is that the <i>purchase</i> event can fire more than once for the same transaction, and GA4 has no built-in way to catch this on its own. The result: revenue, ROAS, and order counts in GA4 reports end up higher than reality, often by several percent to well over ten, with no warning anywhere in the interface.</p>

  <h2>What a duplicate purchase event actually is</h2>

  <p>A duplicate purchase is a situation where a <i>purchase</i> event with the same (or very similar) transaction data gets sent to GA4 more than once.</p>

  <p>GA4 has no built-in mechanism that automatically recognizes two events as "the same transaction", unless the <i>transaction_id</i> parameter is set and consistent, and even then GA4 still counts both occurrences of the event separately in most standard reports rather than deduplicating them in the interface.</p>

  <p>In practice, a duplicate means one real order worth, say, $250 ends up looking like two $250 orders in GA4: $500 of pseudo-revenue from a single customer transaction.</p>

  <h2>The most common causes</h2>

  <ol>
    <li><b>Refreshing the order confirmation page.</b> If the <i>purchase</i> tag is tied to a Page View event on the "Thank you for your order" page, every refresh of that page by the customer (or navigating back and then forward again) fires the event a second time.</li>
    <li><b>The tag firing from both browser-side GTM and a server-side integration.</b> Some stores run a tag in the web GTM container at the same time as a separate server-side integration (for example from the e-commerce platform) sending the same purchase event to GA4, with no coordination between the two.</li>
    <li><b>Two triggers in the same GTM container firing the same tag.</b> A typical configuration mistake: the purchase tag has both a "Custom Event" trigger listening for a Data Layer event and an extra "Page View" trigger on the same page, so it fires twice on a single page load.</li>
    <li><b>No unique, stable <i>transaction_id</i>.</b> When the transaction identifier is never set, or changes between calls for the same order, GA4 has no key to use to recognize a duplicate even manually in reports.</li>
    <li><b>Single-page applications with buggy routing.</b> If the view change after checkout triggers a dataLayer.push with a purchase event on every re-render of the confirmation component, instead of exactly once from the backend, duplicates show up on practically every transaction.</li>
    <li><b>Marketing integrations hooked into the same dataLayer.push.</b> Sometimes it isn't the GA4 tag itself duplicating, but a third-party script (product reviews, a loyalty program) re-firing the whole dataLayer purchase event, which GTM picks up and forwards to GA4 again.</li>
  </ol>

  <h2>How to check whether you have this problem</h2>

  <ul>
    <li><b>Compare transaction counts in GA4 against your sales system.</b> The fastest test: match the number of purchase events and revenue in GA4 for a given day against the actual order count and turnover from your store's backend or payment gateway. A discrepancy of several percent or more on the high side is a warning sign.</li>
    <li><b>Use an Explore report with the Transaction ID dimension.</b> Build a free-form report with the "Purchase event count" metric broken down by the <i>transaction_id</i> dimension. If the same transaction ID shows up with an event count greater than 1, you have a confirmed duplicate.</li>
    <li><b>Check the timestamps of consecutive events for the same transaction.</b> Duplicates within the same session usually have timestamps seconds apart, which helps distinguish them from two genuinely separate orders placed by the same customer on the same day.</li>
    <li><b>Turn on GTM Preview and place a test order.</b> Watch the preview panel step by step: if the purchase tag fires more than once for a single pass through the confirmation page, the problem is in the trigger configuration, not in GA4.</li>
  </ul>

  <h2>How to fix it step by step</h2>

  <ol>
    <li>Decide on a single, exclusive place in your architecture (web GTM or server-side, not both) responsible for sending the purchase event to GA4.</li>
    <li>Give every transaction a unique, stable <i>transaction_id</i>, generated once on the backend and unchanged across subsequent loads of the same confirmation page.</li>
    <li>In GTM, review every trigger attached to the purchase tag and remove redundant ones. The event should fire through a single, unambiguous trigger (usually a Custom Event on a dedicated dataLayer.push), not a Page View trigger.</li>
    <li>Add a simple guard on the confirmation page against re-firing dataLayer.push on refresh, for example a flag in sessionStorage checked before sending the event.</li>
    <li>In SPAs, move the purchase event call out of component render logic and into a one-time effect that fires exactly once after the order confirmation is received from the backend.</li>
    <li>After deploying the fix, verify in GTM Preview and in an Explore report with Transaction ID that every new transaction shows up in GA4 exactly once.</li>
  </ol>

  <h2>How AlertGA4 catches duplicate purchases</h2>

  <p>This type of error is exactly what GA4's own Insights will never catch, because it isn't a general metric going up or down. It's a specific, technical inconsistency at the level of individual events and parameters.</p>

  <p>Once a property is connected, AlertGA4 checks the share of duplicated transactions by <i>transaction_id</i> every day, and if it crosses a set threshold, sends an email with a concrete diagnosis: how many transactions are repeating, and what percentage of that day's revenue is really pseudo-revenue from duplicates.</p>

  <p>With a daily, automated check, the problem surfaces the same day it appears, before it can influence a campaign budget decision built on an inflated ROAS.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does GA4 detect duplicate purchases on its own?</summary>
      <div class="blog-faq-answer"><p>No. GA4 counts every occurrence of the purchase event separately and has no built-in mechanism to automatically recognize two events as the same transaction, even with transaction_id set.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does setting transaction_id fully solve the problem?</summary>
      <div class="blog-faq-answer"><p>transaction_id is essential for being able to detect a duplicate in reports at all, but on its own it doesn't stop GA4 from counting both events in revenue metrics. You still need to fix whatever is causing the tag to fire twice.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How big an impact can duplicates have on revenue?</summary>
      <div class="blog-faq-answer"><p>It depends on the configuration, but stores with the bug tied to confirmation page refreshes have seen revenue inflated by anywhere from a few percent to well over ten, depending on how often customers refresh that page.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is this a GTM problem or a GA4 problem?</summary>
      <div class="blog-faq-answer"><p>The root cause is almost always the event delivery setup, whether that's GTM, a server-side integration, or the page's own code, not GA4 itself. GA4 simply counts faithfully whatever it receives, even if it receives the same event twice.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How does AlertGA4 tell a duplicate apart from two genuine orders by the same customer?</summary>
      <div class="blog-faq-answer"><p>The check relies on the transaction identifier: two purchase events with the same transaction_id are a duplicate by definition, regardless of whether the same customer placed both or not. Two separate orders always carry different transaction_id values.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'duplicate-purchase-events-ga4',
  plSlug: 'zduplikowane-zakupy-ga4',
  title: 'Duplicate Purchase Events in GA4: How Fake Revenue Distorts Your Reports',
  excerpt: 'How a duplicated purchase event inflates revenue and ROAS in GA4, and how to catch it before it affects your ad budget.',
  targetPhrase: 'duplicate purchase events GA4',
  status: 'published',
  publishedAt: '2026-10-19',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
