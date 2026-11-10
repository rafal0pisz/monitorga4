import type { BlogPostEn } from '../posts.en'

const BODY_HTML = `
  <p>If you've ever configured a tag in Google Tag Manager, you've probably run into the term Data Layer. For a lot of people starting out in web analytics, it's one of the first terms that sounds more complicated than it actually is.</p>

  <p>This article explains the Data Layer from the ground up: what it is technically, how to use it on a page, what role it plays in web analytics, and exactly how it connects to Google Tag Manager. We go deeper than a typical introduction on purpose, with concrete code examples you can translate directly into your own implementation.</p>

  <h2>What is a Data Layer</h2>

  <p>In the simplest terms, a Data Layer is a plain JavaScript data structure, usually an array, that lives in the browser as a global object called <code>window.dataLayer</code>. Nothing more, no magic involved: it's the same kind of object you use every day when writing ordinary JavaScript code, except it's assigned to one specific, fixed name and dedicated to a single job, passing along information about what's happening on the page to tools like Google Tag Manager.</p>

  <p>Google popularized the concept alongside the introduction of Google Tag Manager, but the idea itself is universal and much older than GTM: separate the data describing events on a page from the code that reads that data and does something with it. Instead of a tracking tag that has to know the page's HTML structure itself and go looking for specific buttons or CSS classes, the tag reads ready-made, standardized data from one shared place.</p>

  <h2>How dataLayer works technically</h2>

  <p>The technical mechanics of dataLayer come down to one method: <code>push()</code>. It's a standard JavaScript array method used to add a new element to the end of an array. For a Data Layer, that means adding a new object describing an event that just happened on the page.</p>

  <pre class="blog-code-block"><code>window.dataLayer = window.dataLayer || [];
dataLayer.push({
  event: 'newsletter_signup',
  form_location: 'footer'
});</code></pre>

  <p>The first line matters just as much as the push itself: <code>window.dataLayer = window.dataLayer || []</code> creates the dataLayer array if it doesn't exist yet, and leaves it alone if it already does. That's a safeguard against one of the most common mistakes, covered in more detail later in this article.</p>

  <p>Every object passed to <code>dataLayer.push()</code> usually contains at least one field: <code>event</code>, the event's name. That's exactly the field Google Tag Manager uses to recognize that something happened that it should react to. Alongside <code>event</code>, you can pass any number of additional fields, usually called parameters or data layer variables, describing the details of that event.</p>

  <p>dataLayer behaves like a queue: GTM listens for changes to this array and reacts to each new entry in the order it appeared. That's why the order of <code>push()</code> calls on a page matters, especially in more complex scenarios like an e-commerce funnel.</p>

  <h2>What a Data Layer is in web analytics</h2>

  <p>In the context of web analytics, the Data Layer acts as a go-between and a translator at the same time. A website speaks its own language: DOM events, clicks on specific elements, changes in a form's state. Analytics tools like GA4 expect their own standardized language: event and parameter names in a specific format. The Data Layer is where these two languages meet.</p>

  <p>The biggest practical benefit of this split is resilience to changes in a page's code. Without a Data Layer, a typical tracking implementation relies on CSS selectors or DOM structure: a trigger in GTM listens for a click on an element with a specific class or ID. When the product team redesigns the page and changes that class, the trigger stops working, often without any warning.</p>

  <p>With a Data Layer, that same trigger listens for an event name, for example <code>add_to_cart</code>, regardless of what the HTML of the button that fired that event looks like. As long as the developer knows they need to call <code>dataLayer.push()</code> when a product is added to the cart, the rest of the implementation in GTM and GA4 stays resilient to any visual changes on the page.</p>

  <p>This separation has one more consequence: the person configuring measurement in GTM doesn't need to know HTML or CSS, and the developer implementing the Data Layer doesn't need to understand the details of GA4 configuration. Each side is responsible for its own piece, and the Data Layer is the contract that connects them.</p>

  <h2>How to use a Data Layer on a page: practical examples</h2>

  <p>Here are a few typical scenarios you'll run into in almost every measurement implementation.</p>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">A simple custom event</h3>

  <pre class="blog-code-block"><code>dataLayer.push({
  event: 'newsletter_signup',
  form_location: 'footer'
});</code></pre>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">Adding a product to the cart (GA4 e-commerce schema)</h3>

  <pre class="blog-code-block"><code>dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    value: 129.99,
    items: [{
      item_id: 'SKU_12345',
      item_name: 'Running Shoes Model X',
      price: 129.99,
      quantity: 1
    }]
  }
});</code></pre>

  <p>The first line, <code>dataLayer.push({ ecommerce: null })</code>, clears out the previous value of the <code>ecommerce</code> key. This is standard practice when working with e-commerce events, and it prevents a situation where GTM, due to an incomplete overwrite of the object, mixes data from the previous event with data from the current one.</p>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">A completed purchase</h3>

  <pre class="blog-code-block"><code>dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'ORDER-2026-00451',
    currency: 'USD',
    value: 259.98,
    items: [{
      item_id: 'SKU_12345',
      item_name: 'Running Shoes Model X',
      price: 129.99,
      quantity: 2
    }]
  }
});</code></pre>

  <h2>The standard Data Layer schema for e-commerce</h2>

  <p>GA4 expects a specific data structure for e-commerce events, called the Enhanced Ecommerce schema. Sticking to this schema from the start saves a lot of time when configuring tags in GTM, because Data Layer Variables can reference the exact same, predictable paths on every page of the store.</p>

  <table class="blog-table">
    <tr><th>Field</th><th>Level</th><th>Description</th></tr>
    <tr><td>event</td><td>top level</td><td>the event name, e.g. view_item, add_to_cart, begin_checkout, purchase</td></tr>
    <tr><td>ecommerce.currency</td><td>ecommerce</td><td>currency code in ISO 4217 format, e.g. USD, EUR</td></tr>
    <tr><td>ecommerce.value</td><td>ecommerce</td><td>the total value of the cart or transaction</td></tr>
    <tr><td>ecommerce.transaction_id</td><td>ecommerce (purchase)</td><td>a unique order identifier from your own system</td></tr>
    <tr><td>ecommerce.items</td><td>ecommerce</td><td>an array of products covered by the event</td></tr>
    <tr><td>items[].item_id</td><td>single product</td><td>the product identifier, usually a SKU</td></tr>
    <tr><td>items[].item_name</td><td>single product</td><td>the product name shown in reports</td></tr>
    <tr><td>items[].price</td><td>single product</td><td>the unit price</td></tr>
    <tr><td>items[].quantity</td><td>single product</td><td>the quantity of that product in the event</td></tr>
  </table>

  <h2>How to use a Data Layer in Google Tag Manager</h2>

  <p>A Data Layer on its own doesn't accomplish much without the right configuration on the GTM side. Three pieces connect these two worlds: variables, triggers, and the correct script loading order.</p>

  <figure class="blog-figure">
    <svg viewBox="0 0 760 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data flow from a website through the Data Layer and Google Tag Manager to GA4">
      <defs>
        <marker id="arrowD" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8b939a" />
        </marker>
      </defs>
      <rect x="10" y="40" width="160" height="100" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="90" y="75" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Website</text>
      <text x="90" y="95" text-anchor="middle" font-size="10.5" fill="#8b939a">calls</text>
      <text x="90" y="110" text-anchor="middle" font-size="10.5" fill="#8b939a">dataLayer.push()</text>

      <line x1="170" y1="90" x2="196" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowD)" />

      <rect x="200" y="40" width="160" height="100" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="280" y="75" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Data Layer</text>
      <text x="280" y="95" text-anchor="middle" font-size="10.5" fill="#8b939a">window.dataLayer</text>
      <text x="280" y="110" text-anchor="middle" font-size="10.5" fill="#8b939a">event queue</text>

      <line x1="360" y1="90" x2="386" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowD)" />

      <rect x="390" y="30" width="170" height="120" rx="10" fill="#fff" stroke="#e2e6e8" stroke-width="1.5" />
      <text x="475" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Google Tag</text>
      <text x="475" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="#232b31">Manager</text>
      <text x="475" y="98" text-anchor="middle" font-size="10.5" fill="#8b939a">variable + trigger</text>
      <text x="475" y="112" text-anchor="middle" font-size="10.5" fill="#8b939a">Custom Event</text>

      <line x1="560" y1="90" x2="586" y2="90" stroke="#8b939a" stroke-width="1.5" marker-end="url(#arrowD)" />

      <rect x="590" y="40" width="160" height="100" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
      <text x="670" y="75" text-anchor="middle" font-size="13" font-weight="700" fill="#166534">GA4 Tag</text>
      <text x="670" y="95" text-anchor="middle" font-size="10.5" fill="#166534">sends the event</text>
      <text x="670" y="110" text-anchor="middle" font-size="10.5" fill="#166534">to your GA4 property</text>
    </svg>
    <figcaption>A simplified data flow: the page writes an event to the Data Layer, GTM reads it through a variable and a trigger, and a tag passes it on, e.g. to GA4.</figcaption>
  </figure>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">Data Layer Variables</h3>

  <p>For GTM to read a specific field from an object passed to dataLayer, it needs a Data Layer Variable. When you create one, you give it a Data Layer variable name that matches exactly what appears in the object sent by the page, including letter case. For nested fields, such as a cart's value, you use dot notation, for example <code>ecommerce.value</code>.</p>

  <p>This is one of the easiest places to make a mistake: a typo or a mismatched letter case in the variable name means GTM silently fails to find the value and passes along an empty field, with no error message at all.</p>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">Custom Event triggers</h3>

  <p>For anything to happen on the GTM side, you need a trigger that reacts to a specific event name from the <code>event</code> field. A Custom Event trigger compares that name against a condition you set, for example "equals add_to_cart", and fires the tags attached to it only when the condition is met.</p>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">Load order matters</h3>

  <p>The code that initializes the dataLayer array has to appear on the page before the snippet that loads the GTM container, not after it. If the order is reversed, any event sent before GTM has fully loaded can get missed, because at the moment it's sent, the container isn't listening for changes to the array yet.</p>

  <pre class="blog-code-block">&lt;script&gt;
  window.dataLayer = window.dataLayer || [];
&lt;/script&gt;
&lt;!-- Google Tag Manager (simplified example of load order) --&gt;
&lt;script&gt;(function(w,d,s,l,i){ /* ... loads the GTM container ... */ })(window,document,'script','dataLayer','GTM-XXXXXXX');&lt;/script&gt;</pre>

  <p>In practice, most modern CMS and frontend framework implementations handle this correctly out of the box, but it's worth deliberately verifying, especially with a manual installation or a migration to a new platform.</p>

  <h3 style="font-size:17px; font-weight:700; margin:24px 0 10px; color:#232b31;">Data Layer version in container settings</h3>

  <p>GTM lets you choose the Data Layer version in the container settings (Data Layer Version 1 or 2). Version 2 has been the standard for years and supports, among other things, more reliable event passing during navigation in single-page applications. Unless you have a specific reason to stay on version 1, there's no need to change it.</p>

  <h2>The most common mistakes when working with a Data Layer</h2>

  <ul>
    <li><b>Overwriting the array instead of adding to it.</b> Writing <code>window.dataLayer = [{...}]</code> instead of <code>dataLayer.push({...})</code> wipes out everything GTM had previously stored in that array, including the container's own configuration.</li>
    <li><b>Sending events before the array is initialized.</b> If some piece of code calls <code>dataLayer.push()</code> before the line <code>window.dataLayer = window.dataLayer || []</code> has even run, the event fails because dataLayer doesn't exist yet.</li>
    <li><b>Mismatched field names between the page and the GTM configuration.</b> A Data Layer Variable has to reference the exact same key name the page uses, including letter case and nesting.</li>
    <li><b>Not clearing the ecommerce object between events.</b> Skipping <code>dataLayer.push({ ecommerce: null })</code> before the next e-commerce event can cause GTM to merge data from two different events into one incorrect result.</li>
    <li><b>Sending an event before the data is complete.</b> A push fired before the backend or frontend has had a chance to fill in all the required fields sends GA4 an event with missing or empty parameters.</li>
    <li><b>Duplicating the same event.</b> Common during migrations or refactoring: old and new code both call <code>dataLayer.push()</code> for the same user action, artificially doubling the event count in GA4.</li>
  </ul>

  <h2>Checklist for implementing a Data Layer</h2>

  <figure class="blog-figure">
    <div class="blog-checklist">
      <div class="blog-checklist-head">Before you call a Data Layer implementation done</div>
      <ul class="blog-checklist-list">
        <li><span class="blog-checklist-check">✓</span> The code that initializes dataLayer loads before the GTM snippet, not after it</li>
        <li><span class="blog-checklist-check">✓</span> Event and field names are documented in one shared place for the developer and the person configuring GTM</li>
        <li><span class="blog-checklist-check">✓</span> E-commerce events clear the previous ecommerce object before every subsequent push</li>
        <li><span class="blog-checklist-check">✓</span> Every event has been checked in GTM's Preview mode before the container is published</li>
        <li><span class="blog-checklist-check">✓</span> Data arriving in GA4 has been verified in DebugView, not just in GTM's preview</li>
        <li><span class="blog-checklist-check">✓</span> No event is sent twice for the same user action</li>
      </ul>
    </div>
  </figure>

  <h2>How a Data Layer relates to day-to-day GA4 monitoring</h2>

  <p>The Data Layer is the source of most of the data that eventually reaches GA4, so a mistake made at this stage sooner or later shows up in your reports. The problem is that the page itself rarely signals that something went wrong: the code runs without a console error, the tag in GTM fires as planned, and yet the event in GA4 arrives with an empty or duplicated parameter, because somewhere along the way the dataLayer passed along incomplete data.</p>

  <p>AlertGA4 doesn't analyze a page's Data Layer code directly, but it checks its effects every day as they show up in GA4 itself: the presence of key events, coverage of their parameters, and the completeness of the e-commerce funnel. We cover what that kind of checking looks like in practice in our <a href="/en/blog/ga4-event-monitoring">article on GA4 event monitoring</a> and our <a href="/en/blog/ga4-event-verification">guide to event verification</a>.</p>

  <p>A Data Layer isn't an add-on to web analytics, it's its foundation. Well-designed and consistently filled with data, it lets you build measurement that's resilient to visual changes on a page. Neglected, it becomes a source of silent errors that first show up in GA4, and only later, on closer inspection, in the page's own code.</p>
`

const FAQ_HTML = `
  <h2>Frequently asked questions</h2>

  <div class="blog-faq">
    <details class="blog-faq-item">
      <summary>Is a Data Layer the same thing as Google Tag Manager?</summary>
      <div class="blog-faq-answer"><p>No. A Data Layer is an independent JavaScript data structure that can exist even without GTM. Google Tag Manager is one of the tools that reads data from a Data Layer, but not the only possible one.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can you have a Data Layer without Google Tag Manager?</summary>
      <div class="blog-faq-answer"><p>Yes. The dataLayer array itself is a plain JavaScript object, and technically any code can read it, not just GTM. In practice, though, the vast majority of Data Layer implementations are built specifically to work with GTM.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Why doesn't my event show up in GTM, even though I can see it in dataLayer in the browser console?</summary>
      <div class="blog-faq-answer"><p>The most common cause is a mismatch between the event or field name the page actually sends and what's configured in the trigger or variable in GTM. The second common cause is an event sent before the GTM container has fully loaded.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Why clear the ecommerce object before every new event?</summary>
      <div class="blog-faq-answer"><p>To avoid a situation where GTM, due to an incomplete overwrite of a nested object, merges data from the previous e-commerce event with the current one, leading to incorrect values in your reports.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Do you need to implement a Data Layer separately for every page?</summary>
      <div class="blog-faq-answer"><p>Not separately, but consistently. The same event name and the same parameter structure should be used everywhere the same user action occurs, regardless of which page it happened on.</p></div>
    </details>
    <details class="blog-faq-item">
      <summary>Can a Data Layer bug be spotted without looking at the page's code?</summary>
      <div class="blog-faq-answer"><p>Partly, yes. GTM's preview and GA4's DebugView show the effects of Data Layer bugs, such as missing parameters or tags that don't fire, even without analyzing the JavaScript code itself. They won't always point to the exact cause, though, for that you'll usually still need to look at the code.</p></div>
    </details>
  </div>
`

export const post: BlogPostEn = {
  slug: 'what-is-a-data-layer',
  plSlug: 'data-layer-czym-jest',
  title: 'What is a Data Layer, and how do you use it in web analytics',
  excerpt: 'A complete guide to the Data Layer: what it is technically, how to implement it on a page, its e-commerce schema, and exactly how it connects to Google Tag Manager.',
  targetPhrase: 'what is a data layer',
  status: 'published',
  publishedAt: '2026-11-10',
  bodyHtml: BODY_HTML,
  faqHtml: FAQ_HTML,
}
