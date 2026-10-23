-- ============================================================
-- GA4 Quality Score — Migration 037: indexes for history cleanup
-- ============================================================
-- app/api/worker/cleanup-old-data/route.ts deletes dqs_runs/dqs_results
-- rows older than 40 days, once a day. Its WHERE clause filters on run_date
-- alone (across every project, not scoped to one), and the dqs_results
-- delete filters on run_id — this project's base schema predates the
-- supabase/migrations/ convention (nothing here defines dqs_runs/
-- dqs_results themselves), so there's no record of whether a plain index on
-- either column already exists. These are idempotent either way: a
-- composite index with project_id leading (e.g. a project_id+run_date
-- uniqueness constraint) does NOT efficiently serve a run_date-only scan,
-- so without this the daily cleanup would do a full table scan — exactly
-- the kind of query that gets slow as this table grows across many
-- clients, which is the actual thing being fixed here.

create index if not exists idx_dqs_runs_run_date on dqs_runs(run_date);
create index if not exists idx_dqs_results_run_id on dqs_results(run_id);
