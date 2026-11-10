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

  <h2>UTM parameters and Google Ads auto-tagging</h2>

  <p>Google Ads has its own attribution mechanism, independent of UTM: auto-tagging, which appends a gclid parameter to the link instead of utm_source and utm_medium. GA4 recognizes gclid and assigns that session to the Paid Search channel on its own, along with the full campaign, ad group, and keyword details pulled directly from the ad account.</p>

  <p>The problem shows up when someone also attaches manual UTM parameters to a Google Ads link, assuming it can't hurt. In practice, manual utm_source and utm_medium on a link that already carries a gclid can overwrite the data coming from auto-tagging, and the result is a campaign that shows up in reports as a plain google source with cpc medium, instead of the precise campaign, ad group, and keyword attribution from the Google Ads panel.</p>

  <p>The rule is simple: leave Google Ads links with auto-tagging alone, since it's enabled by default on the account, and build manual UTM parameters only for channels that won't tag themselves: email, social media, offline materials, affiliate links, organic posts.</p>

  <h2>How GA4 uses UTM parameters</h2>

  <p>Without any UTM parameters at all, GA4 still assigns a session to some source and medium, based on the browser's referrer header or recognized advertising parameters such as gclid for Google Ads. The problem is that automatic detection handles traffic from search engines and well-known ad platforms reasonably well, but it has no way of recognizing channels like a newsletter, a link in a Facebook post, or a banner on a partner's app.</p>

  <p>UTM parameters override that automatic detection. When GA4 sees utm_source and utm_medium in a URL, it assigns the session to exactly those values, regardless of what the referrer header itself would have shown. That gives you control, but it also means a badly chosen UTM can break attribution just as effectively as having none at all, only in the opposite direction: instead of missing source data, you get false data that looks complete and trustworthy.</p>

  <h2>How GA4 assigns traffic to a channel based on source and medium</h2>

  <p>utm_source and utm_medium values don't land in reports as separate, unrelated columns. GA4 combines them into one of its predefined default channel groups, visible in reports like user acquisition. That classification works off rules matching specific source/medium combinations, and sometimes additional signals like the presence of a gclid, to a channel name.</p>

  <table class="blog-table">
    <tr><th>Default channel</th><th>Example source / medium</th></tr>
    <tr><td>Paid Search</td><td>google / cpc, bing / cpc, or simply the presence of a gclid</td></tr>
    <tr><td>Organic Search</td><td>google / organic, bing / organic</td></tr>
    <tr><td>Paid Social</td><td>facebook / cpc, linkedin / paid-social</td></tr>
    <tr><td>Organic Social</td><td>facebook / social, instagram / organic-social</td></tr>
    <tr><td>Email</td><td>any source with medium=email</td></tr>
    <tr><td>Affiliates</td><td>any source with medium=affiliate</td></tr>
    <tr><td>Referral</td><td>a referring domain with no recognized medium, e.g. partner.com / referral</td></tr>
    <tr><td>Direct</td><td>no source or medium, no referrer</td></tr>
    <tr><td>Unassigned</td><td>a source/medium combination GA4 can't match to any rule</td></tr>
  </table>

  <p>That last row explains one of the more common sources of frustration when building UTM parameters: an unusual, custom utm_medium value, say medium=offline-banner, doesn't match any of GA4's rules, and that traffic lands in the Unassigned channel, even though the source and medium data was sent correctly and is fully visible in detailed reports. That's why, wherever possible, it's worth sticking to utm_medium values GA4 actually recognizes, such as cpc, email, social, or affiliate, and reserving a custom medium for situations where none of those labels genuinely fit.</p>

  <h2>Rules for building UTM parameters that save you trouble later</h2>

  <ul>
    <li><b>Always use lowercase.</b> GA4 treats parameter values as literal strings, so "Facebook" and "facebook" show up as two separate rows in the source/medium report, even though they obviously mean the same source to a human reader.</li>
    <li><b>One consistent name per channel.</b> If you use utm_medium=email one time and utm_medium=mailing or utm_medium=newsletter another time for the same type of send, GA4 will show them as three different mediums, blurring the real picture of that channel in your reports.</li>
    <li><b>Hyphens instead of spaces.</b> A space in a URL turns into an unreadable %20 string, which makes a link harder to read at a glance, for example in server logs or a link preview.</li>
    <li><b>A written naming convention for the whole team.</b> Once more than one person builds campaign links, it's worth keeping a shared sheet listing the source and medium values already in use, so nobody invents a new variant of a name that already exists.</li>
    <li><b>Descriptive utm_campaign values, but not excessively long ones.</b> A campaign name should still be recognizable in a report six months from now, without anyone having to recall exactly what it meant.</li>
  </ul>

  <h2>A naming template for different channels</h2>

  <p>The table below is a starting point for your own convention, built around the channels that most often need manual tagging because they won't tag themselves.</p>

  <table class="blog-table">
    <tr><th>Channel</th><th>utm_source</th><th>utm_medium</th><th>Example utm_campaign</th></tr>
    <tr><td>Newsletter</td><td>newsletter</td><td>email</td><td>weekly-newsletter-45</td></tr>
    <tr><td>Facebook post (organic)</td><td>facebook</td><td>social</td><td>product-launch-x</td></tr>
    <tr><td>Facebook or Instagram ad</td><td>facebook or instagram</td><td>paid-social</td><td>black-friday-2026</td></tr>
    <tr><td>Affiliate program</td><td>the partner's name</td><td>affiliate</td><td>program-name</td></tr>
    <tr><td>SMS</td><td>sms</td><td>sms</td><td>spring-sale</td></tr>
    <tr><td>QR code on printed materials</td><td>qr-flyer, qr-poster</td><td>offline</td><td>trade-show-2026</td></tr>
    <tr><td>Influencer partnership</td><td>the influencer's name</td><td>influencer</td><td>fall-campaign</td></tr>
  </table>

  <p>It's worth standardizing the utm_source names for influencers and partners right at the start of a partnership, for example a first initial plus last name, to avoid the same partner showing up in reports under several different name variants.</p>

  <h2>UTM parameters on QR codes and offline materials</h2>

  <p>UTM parameters aren't limited to links published online. The same mechanism works just as well wherever you want to measure whether a printed flyer, a display stand, or a brochure actually drives traffic to your site, something that's impossible to tell apart from ordinary organic or direct traffic without tagging.</p>

  <p>In practice it looks like this: under a QR code on a poster or flyer, you place a full link with UTM parameters, say with utm_source=qr-poster and utm_medium=offline, instead of the bare homepage address. Every scan of that code reaches GA4 with full source information, letting you count the real traffic from that specific piece of material, and with several poster variants placed in different locations, even compare them against each other using separate utm_content values.</p>

  <p>A long, full UTM link is awkward to type by hand, but under a QR code that length doesn't matter at all, since nobody ever types it manually, they just scan it. If you also want a shorter, readable address to print separately next to the QR code as a backup way to reach the site, an external link-shortening service works for that, as long as you keep the full UTM version somewhere for your own records.</p>

  <h2>Documenting a UTM convention across a team</h2>

  <p>With one person building campaign links, memory is enough. With several people, or an agency handling multiple clients, sooner or later mismatched variants of the same value show up without a written convention, exactly like the "ig" versus "instagram" mistake described above.</p>

  <p>The simplest fix is a shared spreadsheet, accessible to everyone who builds links, with columns matching the UTM structure:</p>

  <table class="blog-table">
    <tr><th>Date</th><th>Channel</th><th>utm_source</th><th>utm_medium</th><th>utm_campaign</th><th>Owner</th></tr>
    <tr><td>2026-11-10</td><td>Newsletter</td><td>newsletter</td><td>email</td><td>weekly-newsletter-45</td><td>Anna</td></tr>
    <tr><td>2026-11-12</td><td>Facebook Ads</td><td>facebook</td><td>paid-social</td><td>black-friday-2026</td><td>Mark</td></tr>
  </table>

  <p>A sheet like this does two things at once: it's a history of every link sent, worth coming back to months later, and it's also a dictionary of the source and medium values already in use, one that every new person on the team should check before inventing their own variant of a name.</p>

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
    <li><b>Changing UTM values mid-campaign.</b> Editing utm_campaign after a link has already been sent out or published splits that same campaign's data into two separate values in reports, even though it's still the same link to its recipients.</li>
    <li><b>Manual UTM on Google Ads links with auto-tagging enabled.</b> As described above, adding your own utm_source and utm_medium to a link that already carries a gclid can overwrite more precise data coming straight from the ad account.</li>
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
    <details class="blog-faq-item">
      <summary>Do UTM parameters work the same way for Google Ads links as for other channels?</summary>
      <div class="blog-faq-answer"><p>Not quite. Google Ads has its own auto-tagging mechanism (gclid), which GA4 recognizes on its own. Manual UTM parameters aren't needed there and can, in some cases, overwrite more precise data coming from auto-tagging.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Why does my UTM traffic end up in the "Unassigned" channel instead of the one I expected?</summary>
      <div class="blog-faq-answer"><p>Because the utm_medium value you used doesn't match any of GA4's default channel grouping rules. Sticking to recognized values like cpc, email, social, or affiliate solves this in most cases.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Are UTM parameters useful for measuring QR code and print traffic?</summary>
      <div class="blog-faq-answer"><p>Yes, it's one of the better ways to measure real traffic from offline materials, as long as you place a full UTM link under every QR code instead of a bare homepage address.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'utm-link-builder-ga4',
  plSlug: 'utm-budowanie-linkow-ga4',
  title: 'UTM parameters in GA4: how to build links to track traffic sources (with a link builder)',
  excerpt: 'What UTM parameters are, how to build campaign links correctly, and which mistakes to avoid so the same campaign doesn’t split into several rows in your GA4 reports. Includes a built-in link generator.',
  targetPhrase: 'UTM parameters GA4',
  status: 'published',
  publishedAt: '2026-11-08',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
  widget: 'utm-builder',
}
