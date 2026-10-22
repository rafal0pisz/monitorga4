-- ============================================================
-- GA4 Quality Score — Migration 030: trial win-back campaign
-- ============================================================
-- Supports a one-time win-back email sent ~2 days after a trial expires
-- (app/api/worker/trial-winback/route.ts): a recap of the account's last
-- check plus a one-time, customer-locked 30%-off Stripe promotion code,
-- and a one-click "why didn't you come back" survey.

alter table profiles add column if not exists trial_winback_sent_at timestamptz;
alter table profiles add column if not exists trial_winback_token text;

-- Speeds up the survey route's lookup-by-token and guarantees two profiles
-- can never collide on the same token (crypto-random, but cheap insurance).
create unique index if not exists idx_profiles_trial_winback_token
  on profiles(trial_winback_token) where trial_winback_token is not null;

create table if not exists trial_winback_responses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table trial_winback_responses enable row level security;
-- No policies = no access via the anon/authenticated key, same as
-- billing_events — only the survey route and the worker (both via
-- createAdminClient/service_role, which bypasses RLS) ever touch this.
