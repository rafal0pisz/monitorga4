-- ============================================================
-- GA4 Quality Score — Migration 023: "Run now" cooldown marker
-- ============================================================
-- Server-side rate limit for the manual "Run now" button (previously only
-- protected by a client-side disabled-while-loading state, which does
-- nothing against multiple tabs or a repeated raw POST). One timestamp per
-- project is enough to gate on — see app/api/worker/run/route.ts.

alter table projects add column if not exists last_manual_run_at timestamptz;
