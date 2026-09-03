-- Critical metric alert: a second, separate alert channel per project that
-- fires only when specific hand-picked checks (core, custom events,
-- ecommerce, parameters) show warn/fail, independent of the overall score
-- threshold used by the existing alert_email.

alter table projects add column if not exists critical_alert_email text;
alter table projects add column if not exists critical_alert_checks text[] not null default '{}';

create table if not exists critical_alert_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  run_id uuid references dqs_runs(id) on delete set null,
  sent_at timestamptz not null default now()
);

-- Same lockdown pattern as alert_log (010_lock_down_remaining_tables.sql):
-- writes only ever happen via the service-role worker, so only a SELECT
-- policy is added for the owning user.
alter table critical_alert_log enable row level security;

drop policy if exists "critical_alert_log_select" on critical_alert_log;

create policy "critical_alert_log_select" on critical_alert_log
  for select using (
    exists (select 1 from projects where projects.id = critical_alert_log.project_id and projects.owner_id = auth.uid())
  );
