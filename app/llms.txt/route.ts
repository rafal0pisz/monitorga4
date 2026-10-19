import { NextResponse } from 'next/server'
import { PLANS, TRIAL_DAYS } from '@/lib/billing/plans'

// llms.txt (llmstxt.org) — a plain-markdown summary AI crawlers/assistants
// can read instead of parsing the full rendered site. Replaces a static
// public/llms.txt that had gone stale in two ways worth avoiding again:
// it still pointed at the pre-migration alertga4.bettersteps.pl domain,
// and it described alerts as firing "when a quality score drops below a
// configurable threshold" — no longer true (the daily alert always sends;
// see app/api/worker/run/route.ts). Building this from the same
// src/lib/billing/plans.ts data the rest of the app uses means a future
// price change can't silently leave this file wrong the same way.
export async function GET() {
  const planLines = PLANS
    .map(p => `- ${p.name}: up to ${p.projectLimit} GA4 properties, ${p.priceMonthlyPLN} PLN/mo or ${p.priceYearlyPLN} PLN/yr`)
    .join('\n')

  const body = `# AlertGA4

> AlertGA4 is a daily quality-monitoring tool for Google Analytics 4 (GA4) properties. It checks a connected GA4 property for missing events, duplicate purchases, self-referral traffic, night-time bot traffic, e-commerce funnel drop-offs, and parameter coverage, then emails a daily report — sent every day regardless of score, so a real problem is never silently missed.

AlertGA4 is built and operated by Bettersteps Sp. z o.o. (Warsaw, Poland). It targets GA4 property owners, marketing agencies managing several clients' GA4 properties, and freelance analytics/marketing consultants.

Access is via Google sign-in with the read-only \`analytics.readonly\` scope — AlertGA4 never modifies a connected GA4 property, its configuration, or its underlying data.

## Plans (PLN, ${TRIAL_DAYS}-day free trial, no card required)
${planLines}

The Agency plan also supports team members with shared access to the account's monitored properties.

## Key pages
- [Homepage](https://alertga4.pl/): product overview, how it works, who it's for.
- [Features](https://alertga4.pl/funkcje): what AlertGA4 checks every day.
- [Pricing](https://alertga4.pl/cennik): plans and prices.
- [Blog](https://alertga4.pl/blog): articles on GA4 data quality — audits, common measurement errors, and how to catch them.
- [Contact](https://alertga4.pl/kontakt): contact form.
- [Privacy Policy](https://alertga4.pl/privacy): what data is collected and how it's used.
- [Terms of Service](https://alertga4.pl/terms): terms governing use of the service.

## What it checks
Missing/expected events, duplicate purchase events, self-referral traffic, direct-traffic anomalies, night-time bot traffic, bounce-rate anomalies, conversion-rate drops, e-commerce funnel continuity (view_item → add_to_cart → view_cart → purchase), geographic/traffic-composition anomalies, and whether configured event parameters actually arrive with data.

## Contact
kontakt@bettersteps.pl · https://www.bettersteps.pl
`

  return new NextResponse(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
