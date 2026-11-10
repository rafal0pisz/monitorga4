import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>The most expensive error in a client report isn't the one that jumps out at you. It's the number that looks credible, gets accepted without question, and only a month later does someone notice the revenue in the report didn't match the sales system. This article is a concrete checklist, a few points to run through before a report ever reaches a client's inbox.</p>

  <h2>Why a good-looking report isn't enough</h2>

  <p>A report that looks wrong gets checked by reflex, a sudden revenue drop or a conversion count of zero raises suspicion on its own. The problem is that the most costly measurement errors in GA4 look exactly the opposite, they push numbers up, not down.</p>

  <p>A duplicated purchase inflates revenue. Night-time bot traffic inflates sessions and, at first glance, improves the conversion rate. None of it looks like an error, not until someone compares the numbers against something independent.</p>

  <p>A client who spots a discrepancy like that on their own remembers one thing above all: that they had to catch it themselves, despite paying someone else to watch for exactly that. This checklist exists so you're never in that position twice.</p>

  <h2>Checklist before sending a report</h2>

  <ol>
    <li><b>Compare transaction count and revenue against the sales system.</b> This is the fastest test for duplicate purchase events, a discrepancy of a few percent upward is a warning sign, not rounding.</li>
    <li><b>Check the share of "(not set)" in key dimensions.</b> Source and medium, landing page, product category, a sudden rise versus previous periods undermines channel attribution across the entire report.</li>
    <li><b>Check the share of Direct traffic and self-referral.</b> A sharp increase usually means lost source attribution, not a sudden spike in brand popularity, and it directly affects which channels in the report look like they're performing.</li>
    <li><b>Check that no key event dropped to zero on any single day of the period.</b> One day without a contact form submission or a purchase event is easy to lose inside a monthly total, and it usually means something broke technically, not that customers stopped buying.</li>
    <li><b>Check coverage of key e-commerce parameters.</b> transaction_id, currency, item_id, missing values on some transactions distort the revenue breakdown by product or currency, even when the transaction count itself checks out.</li>
    <li><b>Check for geographic anomalies or night-time bot traffic.</b> Both inflate session counts and can make engagement metrics look better at first glance, without being real, valuable traffic.</li>
    <li><b>Compare the period against the previous equivalent period, not just year over year.</b> A sudden spike or drop with no business explanation, a campaign, a season, a promotion, is a signal to investigate the cause, not to write straight into the client summary.</li>
    <li><b>Check that last report's numbers still match.</b> A retroactive change to GA4's configuration, or to the data itself, can quietly shift the numbers for an earlier period, it's worth occasionally comparing an archived report against what GA4 shows for that same period today.</li>
  </ol>

  <figure class="blog-figure">
    <div class="blog-checklist">
      <div class="blog-checklist-head">Before sending a report to a client</div>
      <ul class="blog-checklist-list">
        <li><span class="blog-checklist-check">✓</span> Revenue and transaction count match the sales system</li>
        <li><span class="blog-checklist-check">✓</span> Share of "(not set)" is within normal range for this account</li>
        <li><span class="blog-checklist-check">✓</span> Direct traffic and self-referral show no sudden spike</li>
        <li><span class="blog-checklist-check">✓</span> No day in the period is missing a key event</li>
        <li><span class="blog-checklist-check">✓</span> E-commerce parameters (transaction_id, currency, item_id) are covered</li>
        <li><span class="blog-checklist-check">✓</span> No geographic anomalies or night-time bot traffic</li>
        <li><span class="blog-checklist-check">✓</span> The change versus the previous period has a business explanation</li>
        <li><span class="blog-checklist-check">✓</span> Last report's numbers still check out</li>
      </ul>
    </div>
    <figcaption>The same checklist in shortened form, worth keeping on hand for every recurring report.</figcaption>
  </figure>

  <h2>How to make this a repeatable process, not a one-off check</h2>

  <ul>
    <li><b>Check the data 1 to 2 days before sending the report</b>, not on send day, so there's time to explain or fix something before the client sees the numbers.</li>
    <li><b>Keep the checklist somewhere shared by the whole team</b>, so it doesn't depend on the memory of whoever happens to run that account.</li>
    <li><b>Treat a deviation from the norm as a question, not a finished result.</b> A sudden spike or drop with no business explanation, a campaign, a season, a promotion, deserves to be checked before it goes into a report as fact.</li>
    <li><b>Don't rely purely on memory across many accounts at once.</b> With a dozen or more clients, it's easy to run through the checklist thoroughly for the first two accounts and only skim the rest, especially near the end of the month.</li>
  </ul>

  <h2>How AlertGA4 supports this process</h2>

  <p>Most of this checklist is exactly what AlertGA4 checks automatically, every day, for every connected account: duplicate purchases, the share of "(not set)", self-referral, night-time bot traffic, geographic anomalies, and parameter coverage.</p>

  <p>Instead of running through the checklist by hand right before sending a report, you already have thirty days of result history for each client on a single dashboard, so checking before a report comes down to a glance at the score and the trend, not manually working through each point from scratch.</p>

  <p>For an agency handling a dozen or more accounts at once, the difference is especially noticeable near the end of the month, when most reports go out in a short window, instead of repeating the same manual checklist a dozen times in a row, you're reviewing a dozen dashboards with the result already waiting.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Does this checklist replace in-depth data analysis?</summary>
      <div class="blog-faq-answer"><p>No. It's a minimal, technical sanity check on the numbers before sending them out, it doesn't replace business analysis of results or interpreting trends.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>How often should you run through the checklist?</summary>
      <div class="blog-faq-answer"><p>For every recurring report, ideally 1 to 2 days before sending it, so there's time to react if something needs fixing.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What if I already sent a report with a wrong number in it?</summary>
      <div class="blog-faq-answer"><p>The best move is to send the client a short correction right away, with the right number and a brief explanation of the cause, staying quiet and hoping nobody notices costs more trust than the mistake itself.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does this apply to a small agency with just two clients?</summary>
      <div class="blog-faq-answer"><p>Yes, arguably even more so, with one or two accounts, a single error in a report makes up a bigger share of the whole client relationship than it would across a portfolio of dozens of accounts.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can this checklist be fully automated?</summary>
      <div class="blog-faq-answer"><p>A large part of it, yes, a tool that checks data daily, like AlertGA4, covers most of these points automatically. The final call on whether a number makes business sense for a specific client still needs a brief human look, though.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-reporting-checklist',
  plSlug: 'checklist-raportowania-ga4',
  title: "GA4 Reporting Checklist for Agencies: What to Check Before You Send a Client Report",
  excerpt: 'Eight checkpoints worth running through before every recurring GA4 report, so you never send a client inflated or incomplete numbers.',
  targetPhrase: 'GA4 reporting checklist',
  status: 'published',
  publishedAt: '2026-10-24',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
