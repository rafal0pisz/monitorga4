-- GA4 API quota snapshot (per project/property) and per-run sampling info.
--
-- Quota: captured via returnPropertyQuota on the worker's GA4 calls —
-- reflects the property's current tokensPerDay/tokensPerHour/etc usage at
-- the time of the last run, shown on the Billing page.
--
-- Sampling: GA4 can return sampled (not exact) numbers for a query when a
-- property's non-360 tier hits its complexity/volume thresholds. Recorded
-- per dqs_runs row since it depends on that day's query volume/date range,
-- not a static fact about the project.
alter table projects add column if not exists ga4_quota jsonb;
alter table projects add column if not exists ga4_quota_checked_at timestamptz;

alter table dqs_runs add column if not exists sampled boolean;
alter table dqs_runs add column if not exists sampling_ratio numeric;
