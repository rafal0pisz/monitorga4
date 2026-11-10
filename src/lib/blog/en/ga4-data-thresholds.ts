import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>Sometimes a GA4 report looks like part of your traffic has simply vanished. You break sessions down by gender and campaign, and one of the groups shows a blank value, even though you know that segment had real traffic that day.</p>

  <p>That is not a measurement bug, and it is not another flavor of "(not set)". It is data thresholds, a privacy mechanism GA4 applies deliberately and without exception whenever you combine sensitive enough dimensions with a user group that is too small.</p>

  <h2>What data thresholds are in GA4</h2>

  <p>Data thresholds are a safeguard similar to k-anonymity: GA4 will not show a report row if the user group it describes is small enough that it could theoretically be identified.</p>

  <p>This mainly affects dimensions tied to Google Signals, such as age, gender, and interest categories, especially when you combine them with an additional, narrowing dimension like a campaign, a city, or a specific event.</p>

  <p>It is a deliberate mechanism that runs whether or not you are using it on purpose. You cannot selectively turn it off for a single report. You can only reduce the situations where it kicks in.</p>

  <p>It is worth distinguishing this from "(not set)", which we covered separately in a <a href="/en/blog/not-set-in-ga4">dedicated article on "(not set)" in GA4</a>. "(not set)" means an event arrived but was missing a value for that dimension. A data threshold works differently: the event and its values exist, but GA4 deliberately withholds the entire row so it does not expose a group small enough to be potentially identifiable.</p>

  <p>From the point of view of someone reading a report, both situations look similar: a blank row or a missing value. But they call for a completely different response. "(not set)" can usually be reduced by improving your measurement setup. A data threshold cannot be "fixed" that way, because it is not the result of an error. It is the result of too small a sample.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram showing how GA4 data thresholds hide a report row with too few users">
      <defs>
        <marker id="arrowHeadEn1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8b939a" />
        </marker>
      </defs>
      <rect x="16" y="78" width="168" height="64" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="100" y="104" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">Report query</text>
      <text x="100" y="121" text-anchor="middle" font-size="11" fill="#5b6570">e.g. gender × campaign</text>
      <line x1="184" y1="110" x2="224" y2="110" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHeadEn1)" />
      <rect x="228" y="68" width="200" height="84" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="328" y="98" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">Does the group have too</text>
      <text x="328" y="115" text-anchor="middle" font-size="12" font-weight="600" fill="#232b31">few unique users?</text>
      <text x="328" y="134" text-anchor="middle" font-size="11" fill="#5b6570">Google's k-anonymity threshold</text>
      <line x1="432" y1="90" x2="470" y2="48" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHeadEn1)" />
      <text x="447" y="60" text-anchor="middle" font-size="11" font-weight="600" fill="#ca8a04">yes</text>
      <line x1="432" y1="130" x2="470" y2="172" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowHeadEn1)" />
      <text x="447" y="160" text-anchor="middle" font-size="11" font-weight="600" fill="#16a34a">no</text>
      <rect x="474" y="16" width="190" height="64" rx="10" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5" />
      <text x="569" y="42" text-anchor="middle" font-size="12" font-weight="600" fill="#92650a">Row hidden</text>
      <text x="569" y="59" text-anchor="middle" font-size="11" fill="#92650a">blank value or "0", no warning</text>
      <rect x="474" y="172" width="190" height="64" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="569" y="198" text-anchor="middle" font-size="12" font-weight="600" fill="#166534">Value shown</text>
      <text x="569" y="215" text-anchor="middle" font-size="11" fill="#166534">reported normally</text>
    </svg>
    <figcaption>Simplified diagram of how data thresholds work: GA4 hides the entire row instead of showing an imprecise value.</figcaption>
  </figure>

  <h2>When thresholds kick in</h2>

  <ul>
    <li><b>Google Signals is enabled.</b> This is the most common trigger. Google Signals is what powers demographic and interest dimensions, and those are exactly the ones most often subject to thresholds.</li>
    <li><b>The report combines several dimensions at once.</b> A single dimension, age on its own for example, is rarely a problem with decent traffic volume. The risk grows when you pair it with a second, narrowing dimension such as a specific campaign, a city, or a niche conversion event.</li>
    <li><b>Low traffic volume for a given segment.</b> Small GA4 properties or narrow segments, such as a single foreign market or a low-budget campaign, hit the threshold far more often than traffic aggregated at the whole-property level.</li>
    <li><b>Explorations with custom, detailed breakdowns.</b> The more detailed and custom the report you build, the easier it is to unknowingly assemble a dimension combination that trips the threshold.</li>
  </ul>

  <h2>How to tell a data threshold from a genuine lack of traffic</h2>

  <ul>
    <li><b>Check whether GA4 shows a threshold notice.</b> Standard reports and Explorations usually state outright that part of the data was withheld due to thresholds. That is the first and most reliable signal.</li>
    <li><b>Compare against the aggregated total.</b> If the overall session count for a given day is clearly above zero, but a demographic breakdown shows blank rows, that is usually a threshold, not a genuine absence of traffic.</li>
    <li><b>Check the same breakdown over a wider date range.</b> Stretching the date range from a single day to 30 days usually reveals data that was previously hidden. That fact alone confirms the cause was a threshold, not missing traffic.</li>
    <li><b>Remember the Data API does not always flag this as clearly as the interface does.</b> If you are building your own reports on the GA4 Data API, a query for too detailed a dimension combination may simply return fewer rows than you expect, without as clear a warning as the GA4 interface gives. Worth keeping in mind when designing your own dashboards.</li>
  </ul>

  <h2>How to reduce the impact of data thresholds</h2>

  <ol>
    <li>Lengthen your reporting period. More days means more users in each group, which reduces the odds of crossing the threshold.</li>
    <li>Limit how many dimensions you combine at once. Instead of pairing three dimensions right away, start with one and add more only where the volume allows it.</li>
    <li>Consider whether your property actually needs Google Signals. If you are not using remarketing or cross-device reporting, turning off Google Signals significantly reduces how often thresholds trigger.</li>
    <li>For genuinely detailed, event-level analysis, consider a BigQuery export. Raw, unaggregated event data exported to BigQuery is not subject to the same thresholding mechanism as the interface and the Data API. That is the right place to go when standard GA4 reporting consistently falls short.</li>
    <li>Do not treat a blank row as final business information. Before drawing a conclusion from a missing value, check whether it is a threshold effect. Otherwise it is easy to wrongly conclude that a given segment generates no traffic, when it is simply too small for GA4 to want to show it.</li>
  </ol>

  <h2>How AlertGA4 handles data thresholds</h2>

  <p>AlertGA4 does not check demographic or interest dimensions, which are exactly the ones most often subject to thresholds. Its daily checks are built on event-level dimensions and metrics: source and medium, e-commerce parameters, transaction ID, and event names and categories.</p>

  <p>In practice this means data thresholds rarely affect monitoring results. If a check shows a sudden drop or a zero where there was not one before, it usually points to a genuine measurement problem covered elsewhere on this blog, not a thresholding effect.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Are data thresholds a bug in GA4?</summary>
      <div class="blog-faq-answer"><p>No. It is a deliberate privacy protection mechanism that triggers automatically whenever the group described by a report row is too small to show without risking identification of specific individuals.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does it only affect demographic data?</summary>
      <div class="blog-faq-answer"><p>Usually, yes, because age, gender, and interests come from Google Signals and are the most sensitive dimensions. In theory it can affect any sufficiently narrow dimension combination at very low traffic, but in practice it rarely shows up outside demographics.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does disabling Google Signals fully remove thresholds?</summary>
      <div class="blog-faq-answer"><p>It significantly reduces the risk, since it removes the main source of sensitive dimensions, but it is not a zero guarantee. At very low traffic volume, a threshold can theoretically still trigger even without Google Signals.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does exporting to BigQuery solve the problem?</summary>
      <div class="blog-faq-answer"><p>Largely, yes. Raw data exported to BigQuery is event-level, unaggregated data, so it is not subject to the same thresholding applied to the interface and the Data API.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Does AlertGA4 detect when a data threshold has triggered?</summary>
      <div class="blog-faq-answer"><p>Not directly. AlertGA4 does not analyze the dimensions that most often trigger thresholds. That means its checks are rarely exposed to this mechanism in the first place, rather than recognizing and skipping it.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'ga4-data-thresholds',
  plSlug: 'progi-danych-ga4',
  title: 'GA4 data thresholds: why your report suddenly shows empty rows',
  excerpt: 'What data thresholds are in GA4, when they kick in, and how to tell a hidden row apart from a genuine lack of traffic.',
  targetPhrase: 'GA4 data thresholds',
  status: 'published',
  publishedAt: '2026-10-24',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
