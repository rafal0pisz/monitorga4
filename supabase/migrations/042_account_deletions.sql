-- ============================================================
-- GA4 Quality Score — Migration 042: track account deletions
-- ============================================================
-- app/api/account/delete/route.ts hard-deletes profiles + auth.users with
-- no trace left anywhere — a real GDPR-correct erasure, but it also means
-- "how many accounts have churned" was previously unanswerable even for
-- the business itself. This table logs the fact that a deletion happened,
-- with a few non-identifying attributes (plan, account age, project
-- count) useful for churn analysis — never email, name or any other PII,
-- so it stays compatible with the erasure the user actually asked for.
--
-- Starts counting from whenever this migration + the matching app code
-- ship — there is no way to backfill deletions that already happened,
-- since the whole point of the existing flow was to leave no trace.

create table if not exists account_deletions (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now(),
  plan_id text,
  was_paying boolean not null default false,
  account_age_days int,
  project_count int not null default 0
);

alter table account_deletions enable row level security;
-- No policies — written only by the service-role delete route, read only
-- by the admin dashboard (createAdminClient, bypasses RLS either way).
-- Same lockdown pattern as alert_log (010_lock_down_remaining_tables.sql).
