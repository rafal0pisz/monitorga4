import { NextResponse } from 'next/server'

// Experimental, low-cost hedge — "Agentic Resource Discovery" (the draft
// spec this filename comes from) is unadopted as of 2026: no documented
// AI crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) is known
// to consume it, and even the tooling around it admits almost nobody has
// published one yet. Kept deliberately minimal and factual — only real,
// publicly reachable resources, nothing describing capabilities (e.g. a
// public API) that don't actually exist. See app/llms.txt/route.ts for the
// actual-standard equivalent (llmstxt.org), which this intentionally
// mirrors rather than duplicates content-wise.
export async function GET() {
  const body = {
    specVersion: '0.1',
    host: {
      name: 'AlertGA4',
      url: 'https://alertga4.pl',
      description: 'Daily quality monitoring for Google Analytics 4 (GA4) properties — checks for missing events, duplicate purchases, self-referral traffic, bot traffic, e-commerce funnel drop-offs and parameter coverage, then emails a daily report.',
      operator: 'Bettersteps Sp. z o.o.',
    },
    entries: [
      {
        id: 'llms-txt',
        displayName: 'LLM-readable site summary',
        type: 'document',
        mediaType: 'text/markdown',
        url: 'https://alertga4.pl/llms.txt',
        description: 'Plain-text summary of AlertGA4, its plans and key pages, formatted per the llms.txt convention.',
      },
      {
        id: 'homepage',
        displayName: 'AlertGA4 homepage',
        type: 'document',
        mediaType: 'text/html',
        url: 'https://alertga4.pl/',
        description: 'Product overview, how it works, who it is for.',
      },
      {
        id: 'pricing',
        displayName: 'Pricing',
        type: 'document',
        mediaType: 'text/html',
        url: 'https://alertga4.pl/cennik',
        description: 'Plans and prices.',
      },
    ],
  }

  return NextResponse.json(body)
}
