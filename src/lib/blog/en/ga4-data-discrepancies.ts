import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Why does GA4 show a different number than our sales system? That is one of the most common questions anyone running GA4 reporting ever gets asked. The answer is rarely as simple as "something is broken". Most discrepancies have a specific, technical cause rooted in how different tools define and count data in the first place.</p>

  <p>This article organizes the most common sources of discrepancies and shows how to systematically work out whether a given difference is normal or needs fixing.</p>

  <h2>Why no two tools will ever show identical numbers</h2>

  <p>GA4, Google Ads, Meta Ads, your sales system, and your CRM all measure the same reality using entirely different methods. One counts sessions based on a browser identifier, another counts ad clicks, a third counts actually paid orders pulled from a database. Expecting 100% agreement between them is expecting something that is structurally impossible, regardless of how good your implementation is.</p>

  <p>So the goal is not identical numbers. It is a stable, explainable margin of difference that does not suddenly shift for no reason.</p>

  <h2>The most common technical causes of discrepancies</h2>

  <ul>
    <li><b>Sampling in older reports and in Explorations.</b> At very high data volumes and with detailed breakdowns, GA4 may base a result on a sample of the data instead of the full dataset, which by definition gives a different number than counting everything from scratch.</li>
    <li><b>Different time zones and day boundaries.</b> If a GA4 property has a different time zone set than your sales system, a transaction right after midnight lands on a different calendar day in each system, which creates an apparent discrepancy in daily reports.</li>
    <li><b>Different attribution windows between platforms.</b> GA4 defaults to data-driven attribution with a conversion window measured in days, while Google Ads or Meta Ads may apply their own, different windows and models, attributing the same conversion to a different channel or a different day.</li>
    <li><b>Ad blockers and browser restrictions.</b> Some users have extensions installed that block analytics scripts, which lowers the number of sessions GA4 records without affecting the actual number of visits to the site.</li>
    <li><b>Consent Mode and data modeling.</b> When a user does not consent to analytics cookies, part of the data in GA4 is statistically modeled rather than directly measured, which by nature differs from hard numbers coming out of a transactional system.</li>
    <li><b>Processing delay in GA4.</b> Data in standard GA4 reports can keep maturing for twelve to twenty four hours after an event, so comparing numbers in real time, on the same day, will almost always show a lower count than the final one.</li>
    <li><b>Differences in how a conversion is defined.</b> A sales system counts an order as a sale the moment it is placed, while GA4 records a purchase event when it is sent from the frontend or from a server-side integration, which gives a different result for phone orders or delayed payments.</li>
  </ul>

  <h2>Discrepancies between GA4 and your sales system</h2>

  <p>This type of discrepancy deserves special attention, because it is the one that most often triggers questions from clients and management.</p>

  <ul>
    <li><b>Orders placed by phone or offline.</b> If a customer calls and places an order without ever visiting the confirmation page, the sales system will record it, but GA4 will never know about it unless a separate integration sends that event to GA4 manually.</li>
    <li><b>Duplicate purchase events.</b> The opposite direction of error: GA4 shows more transactions than actually took place, because the same order got recorded more than once. We covered this in detail in a <a href="/en/blog/duplicate-purchase-events-ga4">dedicated article on duplicate purchase events</a>.</li>
    <li><b>Returns and cancelled orders.</b> The sales system usually updates an order's status after a return, while GA4 in a standard setup does not retract an already recorded purchase event, so historical revenue in GA4 tends to run higher than the final figure that accounts for returns.</li>
    <li><b>Delay between placing an order and confirming payment.</b> With deferred payments or traditional bank transfers, the purchase event in GA4 can be sent at a different moment than when revenue is actually booked in the financial system.</li>
  </ul>

  <h2>How to systematically diagnose a discrepancy</h2>

  <ol>
    <li>Pin down exactly which numbers you are comparing: the same date range, the same time zone, the same definition of a transaction in both systems.</li>
    <li>Check whether the GA4 report you are comparing could have been subject to sampling at all, especially if you are using an Exploration on a large dataset.</li>
    <li>Wait at least twenty four hours after an event before comparing numbers, to rule out the effect of data that is still immature and processing.</li>
    <li>Check whether GA4's transaction count is inflated by duplicates, by comparing the number of purchase events against the number of unique transaction_id values.</li>
    <li>Check the attribution model used in the ad platform report you are comparing against, and compare it with GA4's model, instead of assuming both count the same way.</li>
    <li>Calculate the discrepancy margin over the last several periods and check whether it is stable. A stable difference of a few percent is usually methodology, not a bug. A difference that suddenly grows is a signal worth investigating further.</li>
  </ol>

  <h2>What level of discrepancy is normal, and what calls for an alarm</h2>

  <p>There is no single universal number, because the level of natural discrepancy depends on your industry, platform, and cookie consent setup. In practice, the size of the difference matters less than its stability over time.</p>

  <p>A discrepancy in the range of a few to a dozen percent, repeating consistently month after month, is usually down to methodology and does not call for intervention. A discrepancy that suddenly doubles, or appears where there was none before, almost always has a specific, technical cause worth diagnosing before it reaches a report for a client or management.</p>

  <h2>How AlertGA4 helps catch discrepancies before they become a problem</h2>

  <p>AlertGA4 does not directly compare GA4 against external sales systems, since that depends on integrations specific to each business. Instead, it watches daily for the sources of discrepancy that sit on GA4's own side and that most often cause sudden, unexplained changes: duplicate purchase events, the share of "(not set)" in key dimensions, unusual bot traffic, and geographic anomalies.</p>

  <p>That means that before you even start looking for the cause of a discrepancy in an external system, you already have confirmation or exclusion of the most common technical causes sitting on GA4's own side.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does a discrepancy between GA4 and another tool always mean an error?</summary>
      <div class="blog-faq-answer"><p>No. Different tools measure data using different methods, so some level of discrepancy is natural and expected. The warning sign is not the difference itself, but a sudden change relative to your established baseline.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How long should you wait before comparing data from GA4?</summary>
      <div class="blog-faq-answer"><p>Usually at least twenty four hours after an event, to let the data fully process. Comparing same-day data in real time will almost always show a lower number than the final one.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Why do Google Ads and GA4 show a different number of conversions?</summary>
      <div class="blog-faq-answer"><p>Both platforms can apply different attribution models and windows, crediting the same conversion to a different day or a different channel. That is a methodological difference, not necessarily a measurement error on its own.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How do you check whether a GA4 report was based on sampled data?</summary>
      <div class="blog-faq-answer"><p>GA4 flags this directly in the Explorations interface, usually as an icon or a message next to the query result. Standard reports are subject to sampling less often than free-form Explorations run on very large datasets.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can data discrepancies be eliminated entirely?</summary>
      <div class="blog-faq-answer"><p>No, not as long as you are comparing tools built on different measurement methodologies. The realistic goal is reducing discrepancies that come from technical errors, not forcing the numbers into 100% agreement.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-data-discrepancies',
  plSlug: 'rozbieznosci-danych-ga4',
  title: "Why GA4 Numbers Don't Match: The Most Common Causes of Data Discrepancies",
  excerpt: 'Sampling, time zones, attribution windows, and Consent Mode: where discrepancies between GA4 and other data sources come from, and how to diagnose them.',
  targetPhrase: 'GA4 data discrepancies',
  status: 'published',
  publishedAt: '2026-11-05',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
