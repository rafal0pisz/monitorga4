-- dqs_runs.run_date has always meant "when the daily worker executed",
-- while the actual GA4 data it checked is from 2 days earlier (see
-- getDailyRanges()/checkedDate in app/api/worker/run/route.ts — GA4 data
-- isn't fully settled until ~2 days after the fact, so the unattended
-- cron always checks the day before that). The score trend chart and the
-- check-history page were plotting/labelling by run_date, which made a
-- data quality problem on e.g. Nov 14 show up under "Nov 16" (the day the
-- run happened to execute), not the day the bad data is actually from.
--
-- Add data_date to carry the GA4 data date alongside run_date (which keeps
-- its existing meaning everywhere else — watchdog's "ran today" check,
-- cleanup-old-data's retention cutoff, the (project_id, run_date) upsert
-- uniqueness, business stats, trial-winback — none of that changes).
--
-- Idempotent / safe to re-run.
alter table dqs_runs add column if not exists data_date date;

-- Backfill existing rows: the worker's lag has always been a fixed 2 days
-- (see the comment above getDailyRanges()), so every historical run's data
-- date is reconstructable from its run_date alone. Cast defensively in case
-- run_date is stored as text rather than a native date column.
update dqs_runs
set data_date = (run_date::date - 2)
where data_date is null;

create index if not exists idx_dqs_runs_project_data_date on dqs_runs (project_id, data_date);
