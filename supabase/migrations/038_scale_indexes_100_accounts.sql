-- ============================================================
-- GA4 Quality Score — Migration 038: indexes found in a ~100-account
-- pre-scale audit
-- ============================================================

-- alert_log / critical_alert_log are queried by project_id on every worker
-- run (app/api/worker/run/route.ts) and by account export/delete
-- (app/api/account/export, /delete), with no index on that column anywhere
-- in the migration history — same "full scan that gets slower every day
-- across every client" shape that 037 fixed for dqs_runs/dqs_results, just
-- not yet applied here. These two tables also have no retention cap; see
-- the companion change to app/api/worker/cleanup-old-data/route.ts.
create index if not exists idx_alert_log_project_id on alert_log(project_id);
create index if not exists idx_critical_alert_log_project_id on critical_alert_log(project_id);

-- profiles.stripe_customer_id is looked up on every single Stripe webhook
-- delivery (app/api/stripe/webhook/route.ts) with no index. Cheap today
-- (profiles tracks user count, not event count), but trivial to fix now.
create index if not exists idx_profiles_stripe_customer_id on profiles(stripe_customer_id);

-- billing_events has no index on profile_id (only stripe_event_id is
-- uniquely indexed, which is all today's idempotency check needs) — add it
-- ahead of any future per-customer billing view, since this table is
-- intentionally never pruned (billing/audit history).
create index if not exists idx_billing_events_profile_id on billing_events(profile_id);
