-- ============================================================
-- GA4 Quality Score — Migration 026: daily alert no longer gated by score
-- ============================================================
-- The per-project client alert used to only send when score_total dropped
-- below alert_threshold — which silently dropped the one email that
-- actually mattered whenever the score stayed just above the configured
-- line despite real warn/fail checks. The daily alert now sends every day
-- by default (see app/api/worker/run/route.ts), with alert_threshold kept
-- purely for display/stats (trend chart reference line, the email's own
-- stat line). This column is the new, explicit opt-in for anyone who wants
-- the old "only email me when something's actually wrong" behavior —
-- except based on a real warn/fail in that day's checks, not a score
-- cutoff.

alter table projects add column if not exists alert_only_on_issues boolean not null default false;
