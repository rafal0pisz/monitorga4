import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>A GA4 audit isn't the same thing as everyday data-quality monitoring. It's a one-off, in-depth review of a property's entire configuration, usually done when taking over an account, after a major change to the site, or on a recurring basis, once a quarter or every six months, to make sure the foundations that daily monitoring relies on are still correct.</p>

  <p>This checklist is ten specific things to check, ordered from the property's general configuration down to the details of individual events.</p>

  <h2>Why audit, even when the data looks fine</h2>

  <p>Data that looks trustworthy isn't the same as data that's actually correct. Most of the costliest errors in GA4 don't look like errors at all: revenue inflated by duplicate purchases, lost channel attribution from self-referral, an undercounted conversion rate because a key event was never registered. Every one of these sits within a range of numbers that doesn't raise suspicion at first glance.</p>

  <p>An audit is a way to stop relying on the impression that everything looks fine, and systematically check the specific, known places where GA4 most often gets it wrong.</p>

  <h2>Checklist: 10 things to check in a GA4 audit</h2>

  <ol>
    <li><b>Property and data stream configuration.</b> Check whether the Measurement ID visible in the data stream settings actually matches the one implemented on the site, whether the property's time zone and currency are set correctly, and whether any duplicate, unused data streams from earlier implementations still exist.</li>
    <li><b>Account access permissions.</b> Review the list of users with account- and property-level access. Former employees, external agencies whose engagement has ended, and test accounts with admin rights are a common, unnecessary security risk.</li>
    <li><b>Key event tagging.</b> Check whether events that actually matter to the business, such as a purchase, a form submission, or a sign-up, are marked as key events, and that no irrelevant test event got marked by mistake.</li>
    <li><b>Self-referral and own-domain filtering.</b> Check the list of excluded referrers in the data stream settings and confirm your own domain, along with any external payment gateway domains the checkout flow passes through, are on it.</li>
    <li><b>Share of "(not set)" and Direct traffic.</b> Compare the current share of these two categories against previous periods. A sudden jump in either one almost always points to a specific, fixable measurement problem.</li>
    <li><b>E-commerce event completeness.</b> Check whether every event in the standard funnel, from <i>view_item</i> to <i>purchase</i>, is present, and whether the counts at each step of the funnel decrease in a logical order.</li>
    <li><b>Standard and custom parameter coverage.</b> Check whether key parameters, such as <i>currency</i>, <i>transaction_id</i>, or <i>item_id</i>, accompany e-commerce events in the vast majority of cases, not just some of them.</li>
    <li><b>Duplicate purchase events.</b> Compare the number of unique <i>transaction_id</i> values against the number of purchase events over the same period. A mismatch means some transactions are being counted more than once.</li>
    <li><b>Consent Mode implementation.</b> Check whether the cookie consent banner actually communicates with GTM and GA4 as Consent Mode requires, and whether the default consent state was set deliberately, rather than left at an accidental default value.</li>
    <li><b>Whether recurring monitoring exists after the audit.</b> Check whether someone, or something, will actually keep watching these same nine points on a regular basis once the audit is done. An audit nobody monitors the results of only fixes things for a moment.</li>
  </ol>

  <h2>How often to run a full GA4 audit</h2>

  <ul>
    <li><b>When taking over an account from another agency or person.</b> Before you start reporting numbers to a client, it's worth knowing what foundation they actually rest on.</li>
    <li><b>After a major site change or platform migration.</b> A CMS change, an e-commerce platform migration, or a site rebuild is exactly when the most parts of a GA4 configuration can quietly drift out of sync with the new implementation.</li>
    <li><b>On a recurring basis, every quarter or six months, regardless of changes.</b> Even with no obvious trigger, it's worth running the full list periodically, because some problems build up gradually, with no single, clear moment they started at.</li>
  </ul>

  <h2>A one-off audit versus ongoing monitoring</h2>

  <p>An audit is a snapshot of the account's state at one point in time. It answers whether everything is fine right now, not whether it still will be in two months. That's exactly why point ten on this checklist, about recurring monitoring, matters just as much as the other nine, even though it doesn't describe a specific technical error on its own.</p>

  <p>Without ongoing monitoring, the exact same problems you just fixed during the audit can quietly come back with the next site change, the next GTM update, or the next marketing integration, before anyone notices.</p>

  <h2>How AlertGA4 supports the audit and keeps its results in place</h2>

  <p>Most of this checklist's technical points, five through nine, are exactly what AlertGA4 checks automatically, every day, once you connect a GA4 property: self-referral, the share of "(not set)", e-commerce event completeness, parameter coverage, and duplicate purchases.</p>

  <p>In practice, that makes the audit itself faster, since several points can be verified with one look at a dashboard instead of manually working through each report on its own. More importantly, the audit's results stop being a one-off snapshot: once it's done, those same points keep being watched every day, with no need to schedule another manual review six months out.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>How long does a full GA4 audit take?</summary>
      <div class="blog-faq-answer"><p>Working through all ten points by hand, for one property, usually takes anywhere from one to several hours, depending on how complex the configuration is and how many events are being tracked.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does the audit have to be done manually, or can it be automated?</summary>
      <div class="blog-faq-answer"><p>Some points, around access permissions or data stream configuration, require a manual review inside the GA4 panel. Points about the data's own quality, such as self-referral, "(not set)", or duplicate purchases, can be automated with a monitoring tool.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does a GA4 audit differ for an online store versus a site with no e-commerce?</summary>
      <div class="blog-faq-answer"><p>Yes, the points about the e-commerce funnel and transaction parameters don't apply without an e-commerce module. The other points, about property configuration, permissions, self-referral, and "(not set)", apply regardless of the type of site.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>What if the audit turns up several problems at once?</summary>
      <div class="blog-faq-answer"><p>It's worth ranking them by impact on key business metrics, usually starting with anything that directly affects revenue, like duplicate purchases, and ending with less critical issues, like a single unregistered custom dimension.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Is a one-off audit enough for the long term?</summary>
      <div class="blog-faq-answer"><p>No. An audit shows the account's state at one moment, and both configuration and implementation change over time. Without recurring monitoring after the audit, the same problems can quietly come back with the next site change.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-audit-checklist',
  plSlug: 'audyt-ga4-checklist',
  title: 'GA4 audit checklist: 10 things to check before you trust your reports',
  excerpt: 'A practical checklist: ten places where GA4 most often gets it wrong, before the error ends up in a monthly report.',
  targetPhrase: 'GA4 audit checklist',
  status: 'published',
  publishedAt: '2026-11-05',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
