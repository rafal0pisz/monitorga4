# AlertGA4 — working notes for Claude Code

Product: AlertGA4, a paid SaaS that monitors GA4 implementations for clients
and sends automated daily alerts. Clients pay for this — a silent regression
in the daily check/alert pipeline directly costs them money and trust, not
just us.

## Before committing anything touching the worker, cron, or billing/trial logic

This is the highest-stakes code in the app: `app/api/worker/run/route.ts`,
`app/api/worker/watchdog/route.ts`, `src/lib/billing/*`, and `vercel.json`'s
cron schedules. A bug here doesn't throw a visible error — it just means
clients silently stop getting alerts until someone notices and complains,
which has already happened once (7 days of zero automatic runs, caused by
an untested assumption about exact Vercel cron timing).

- `tsc --noEmit` and `next build` passing is necessary but **not
  sufficient** — they only prove the code compiles, not that it behaves
  correctly. Actually exercise the runtime behavior before considering the
  change done:
  - Run `next dev` with dummy env vars (`NEXT_PUBLIC_SUPABASE_URL`,
    `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, etc. — see any recent
    session for the exact set) and hit the actual endpoint with `curl`,
    checking both the HTTP status and the response body.
  - For anything time/schedule-dependent (cron gates, DST logic, "already
    ran today" markers), don't just trust the math — print/log the actual
    computed values (current UTC time, current Warsaw time, the gate's
    decision) and confirm they match what you expect for the current
    real-world moment, for the edge cases (midnight boundaries, DST
    transitions), and for a plausible failure path (DB query errors, a
    missing table).
  - Always test the **error/failure path**, not just the happy path. Ask:
    "if this specific query/call fails, does the code fail open (degrade
    gracefully, keep working) or fail closed (silently block everything)?"
    Default to failing open for anything that gates monitoring or alerting
    — a missed alert is worse than one that fires despite the gate
    technically allowing it.
  - Clean up `.env.local`, kill any dev server you started, and remove it
    all before finishing — don't leave test artifacts in the repo or
    running processes behind.

## Standing workflow rules (apply to every change, not just the above)

- Verify with `npx tsc --noEmit` and `npx next build` before committing.
  Clean up afterward: `git checkout -- next-env.d.ts` and
  `rm -f tsconfig.tsbuildinfo`.
- Every commit on the feature branch also gets fast-forward pushed directly
  to `main` (Vercel auto-deploys `main`). Push both.
- Always provide the full SQL for any new Supabase migration directly in
  chat — never assume it's been (or will be) run just because the
  migration file exists in the repo. This project's migration history has
  repeatedly turned out to be aspirational rather than applied: several
  migrations (005's `parameter_catalog`, 009's `checks_config` RLS) sat in
  the repo for a long time without ever being pasted into Supabase's SQL
  editor, and the security advisories kept recurring until that was
  actually done. Don't assume a migration file being committed means the
  live database reflects it — ask, or give idempotent SQL that's safe to
  run regardless.
- Everything behind login (`/dashboard/*`, `/project/*`, and anything else
  a signed-in user sees) must be English-only. The public marketing site
  (`/`, `/funkcje`, `/cennik`, `/kontakt`, `/privacy`, `/terms`) is Polish.
- `kontakt@bettersteps.pl` / `www.bettersteps.pl` refer to the parent
  company (Bettersteps Sp. z o.o.) and should stay as-is — don't confuse
  these with the app's own domain when doing domain-related work.
