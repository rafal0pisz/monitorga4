import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>UTM parameters are five short tags you append to a URL that tell GA4 (and pretty much every other analytics tool) exactly where a given visit came from. The name goes back to the Urchin Tracking Module, a feature of Urchin Software, the company Google acquired in 2005 and built the first version of Google Analytics on top of.</p>

  <p>This article covers what each UTM parameter does, how GA4 uses them, which rules to follow when building them, and includes a ready-made generator that assembles a correct link from whatever values you type in.</p>

  <h2>What are UTM parameters</h2>

  <p>UTM parameters are plain query string parameters in a URL, technically no different from any other string after the question mark. GA4 recognizes five specific parameter names and uses them to assign a session to a specific source, medium, and campaign, instead of relying only on automatic detection based on the referrer header.</p>

  <p>Here's a full link with UTM parameters:</p>

  <code class="blog-code">https://yoursite.com/offer?utm_source=newsletter&utm_medium=email&utm_campaign=black-friday-2026</code>

  <h2>The five UTM parameters and what each one does</h2>

  <table class="blog-table">
    <tr><th>Parameter</th><th>What it's for</th><th>Example value</th><th>Required</th></tr>
    <tr><td>utm_source</td><td>where the traffic comes from, the specific source</td><td>newsletter, facebook, google</td><td>Yes</td></tr>
    <tr><td>utm_medium</td><td>the type of channel the traffic arrives through</td><td>email, cpc, social, referral</td><td>Yes</td></tr>
    <tr><td>utm_campaign</td><td>the name of the specific campaign or promotion</td><td>black-friday-2026, weekly-newsletter</td><td>Yes</td></tr>
    <tr><td>utm_term</td><td>a keyword, mainly used for paid search campaigns</td><td>ga4-monitoring</td><td>No</td></tr>
    <tr><td>utm_content</td><td>distinguishes variants within the same campaign</td><td>top-banner, footer-link</td><td>No</td></tr>
  </table>

  <p>It's worth treating the first three parameters as mandatory on every campaign link. utm_term and utm_content mainly come in handy when you're testing several creative variants or keyword groups within one campaign and want to tell them apart in reports.</p>

  <h2>How GA4 uses UTM parameters</h2>

  <p>Without any UTM parameters at all, GA4 still assigns a session to some source and medium, based on the browser's referrer header or recognized advertising parameters such as gclid for Google Ads. The problem is that automatic detection handles traffic from search engines and well-known ad platforms reasonably well, but it has no way of recognizing channels like a newsletter, a link in a Facebook post, or a banner on a partner's app.</p>

  <p>UTM parameters override that automatic detection. When GA4 sees utm_source and utm_medium in a URL, it assigns the session to exactly those values, regardless of what the referrer header itself would have shown. That gives you control, but it also means a badly chosen UTM can break attribution just as effectively as having none at all, only in the opposite direction: instead of missing source data, you get false data that looks complete and trustworthy.</p>

  <h2>Rules for building UTM parameters that save you trouble later</h2>

  <ul>
    <li><b>Always use lowercase.</b> GA4 treats parameter values as literal strings, so "Facebook" and "facebook" show up as two separate rows in the source/medium report, even though they obviously mean the same source to a human reader.</li>
    <li><b>One consistent name per channel.</b> If you use utm_medium=email one time and utm_medium=mailing or utm_medium=newsletter another time for the same type of send, GA4 will show them as three different mediums, blurring the real picture of that channel in your reports.</li>
    <li><b>Hyphens instead of spaces.</b> A space in a URL turns into an unreadable %20 string, which makes a link harder to read at a glance, for example in server logs or a link preview.</li>
    <li><b>A written naming convention for the whole team.</b> Once more than one person builds campaign links, it's worth keeping a shared sheet listing the source and medium values already in use, so nobody invents a new variant of a name that already exists.</li>
    <li><b>Descriptive utm_campaign values, but not excessively long ones.</b> A campaign name should still be recognizable in a report six months from now, without anyone having to recall exactly what it meant.</li>
  </ul>

  <h2>Build a link with UTM</h2>

  <p>Enter your destination URL and parameter values below. The generator will assemble the full link, convert uppercase letters to lowercase and spaces to hyphens, and let you copy the finished address with one click.</p>

<!--WIDGET-->

  <h2>The most common mistake: tagging links on your own site</h2>

  <p>The most serious, and at the same time most common, UTM mistake is attaching them to links that point back to your own domain, for example a link in an email footer that leads back to the homepage, or a link in the site's navigation menu.</p>

  <p>UTM parameters are meant to describe where a visitor came from externally, not to label traffic moving around inside your own site. Clicking an internal link with a UTM tag attached can start a new session in GA4 and overwrite the original source the visitor actually arrived from, replacing it with an accidental internal tag. This is one of the mechanisms behind self-referral, and one of its most common causes in practice.</p>

  <h2>Other common mistakes</h2>

  <ul>
    <li><b>Missing utm_medium while utm_source is present.</b> A source on its own without a medium gives an incomplete picture, because GA4 groups channels based on the combination of both values, not source alone.</li>
    <li><b>Publishing a link without testing it.</b> A typo in a parameter name, for example utmsource instead of utm_source, means GA4 won't recognize the value at all, and all traffic from that link ends up under the automatically detected channel instead of the tagged campaign.</li>
    <li><b>Different values for the same platform across campaigns.</b> If one person on the team uses utm_source=ig and another uses utm_source=instagram, the report ends up with two separate rows instead of one consistent source.</li>
    <li><b>Tagging organic social posts as paid.</b> Copying a UTM template from a paid campaign onto a regular, unpaid post inflates the reported volume of paid traffic at the expense of organic.</li>
  </ul>

  <h2>How AlertGA4 relates to UTM quality</h2>

  <p>AlertGA4 doesn't build or validate UTM links themselves, but it checks for the effects of misusing them every day: a sudden rise in the share of self-referral, an unusual spike in a specific medium relative to that account's typical norm, or a drop in organic traffic that often accompanies mistagged campaigns. If something like that shows up, you get an email with a concrete diagnosis the same day, instead of noticing it only at the next monthly review.</p>

  <p>UTM parameters are one of the few parts of measurement you have full control over before traffic ever reaches GA4. A well-built, consistently applied UTM takes a few seconds to create and saves hours of trying to reconstruct where traffic actually came from, months later.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Do UTM parameters affect SEO or search rankings?</summary>
      <div class="blog-faq-answer"><p>No. UTM parameters are purely tracking tags read by analytics tools. They have no effect on rankings as long as the page has a properly set canonical tag, which is usually needed anyway regardless of UTM parameters.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can I use UTM parameters on internal links on my own site?</summary>
      <div class="blog-faq-answer"><p>It's better to avoid it. This is one of the most common causes of self-referral, because clicking an internal link with a UTM tag can overwrite that visitor's original traffic source.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does letter case matter for UTM parameters in GA4?</summary>
      <div class="blog-faq-answer"><p>Yes. GA4 treats parameter values as literal strings, so "Facebook" and "facebook" will show up in reports as two separate rows.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Are utm_term and utm_content required?</summary>
      <div class="blog-faq-answer"><p>No. Only utm_source, utm_medium, and utm_campaign are considered core parameters. utm_term and utm_content are supplementary, useful mainly for telling variants apart within a single campaign.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can a generated UTM link be shortened afterward?</summary>
      <div class="blog-faq-answer"><p>Yes, with an external link-shortening service. It's still worth keeping the full, readable version of the link somewhere for your own records, since the shortened address no longer shows which UTM values it actually contains.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'utm-link-builder-ga4',
  plSlug: 'utm-budowanie-linkow-ga4',
  title: 'UTM Parameters in GA4: How to Build Links to Track Traffic Sources (with a Link Builder)',
  excerpt: 'What UTM parameters are, how to build campaign links correctly, and which mistakes to avoid so the same campaign doesn’t split into several rows in your GA4 reports. Includes a built-in link generator.',
  targetPhrase: 'UTM parameters GA4',
  status: 'published',
  publishedAt: '2026-11-08',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
  widget: 'utm-builder',
}
