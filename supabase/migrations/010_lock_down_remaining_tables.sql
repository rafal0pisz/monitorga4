-- ============================================================
-- GA4 Quality Score — Migration 010: lock down remaining tables
-- ============================================================
-- Two separate holes found while auditing policies after 007/008/009:
--
-- 1. custom_event_checks / ecommerce_config / parameter_checks all have
--    a single "using (true) with check (true)" policy — fully open to
--    anyone with the anon/authenticated key, completely bypassing the
--    ownership check we added to the get_*/save_* RPCs (SECURITY DEFINER
--    functions don't stop someone from hitting the underlying table
--    directly via PostgREST).
--
-- 2. dqs_runs / dqs_results / alert_log / weekly_reports / profiles all
--    scope by "org_id = my_org_id()". Since every project in this app
--    currently shares one hardcoded org_id, that clause is effectively
--    "true" for any signed-in user — any authenticated account can read
--    every other account's runs, results, alerts, weekly reports, and
--    (worst of all) profiles.ga4_access_token / ga4_refresh_token.
--    my_org_id() also queries profiles, whose own policy called
--    my_org_id() again — the same recursive "stack depth limit exceeded"
--    bug as migration 008, just latent here because nothing has queried
--    these tables as 'authenticated' yet.
--
-- The app only ever touches these tables through createAdminClient()
-- (service role, bypasses RLS) — no browser code needs direct access —
-- so this can be locked down to real per-owner scoping with zero app
-- changes.

-- ---- custom_event_checks / ecommerce_config / parameter_checks ----
-- Same shape as checks_config (migration 009): scope by the owning
-- project instead of leaving them wide open.

drop policy if exists "ce_all" on custom_event_checks;

create policy "custom_event_checks_select" on custom_event_checks
  for select using (
    exists (select 1 from projects where projects.id = custom_event_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "custom_event_checks_insert" on custom_event_checks
  for insert with check (
    exists (select 1 from projects where projects.id = custom_event_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "custom_event_checks_update" on custom_event_checks
  for update using (
    exists (select 1 from projects where projects.id = custom_event_checks.project_id and projects.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects where projects.id = custom_event_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "custom_event_checks_delete" on custom_event_checks
  for delete using (
    exists (select 1 from projects where projects.id = custom_event_checks.project_id and projects.owner_id = auth.uid())
  );

drop policy if exists "ec_all" on ecommerce_config;

create policy "ecommerce_config_select" on ecommerce_config
  for select using (
    exists (select 1 from projects where projects.id = ecommerce_config.project_id and projects.owner_id = auth.uid())
  );
create policy "ecommerce_config_insert" on ecommerce_config
  for insert with check (
    exists (select 1 from projects where projects.id = ecommerce_config.project_id and projects.owner_id = auth.uid())
  );
create policy "ecommerce_config_update" on ecommerce_config
  for update using (
    exists (select 1 from projects where projects.id = ecommerce_config.project_id and projects.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects where projects.id = ecommerce_config.project_id and projects.owner_id = auth.uid())
  );
create policy "ecommerce_config_delete" on ecommerce_config
  for delete using (
    exists (select 1 from projects where projects.id = ecommerce_config.project_id and projects.owner_id = auth.uid())
  );

drop policy if exists "pc_all" on parameter_checks;

create policy "parameter_checks_select" on parameter_checks
  for select using (
    exists (select 1 from projects where projects.id = parameter_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "parameter_checks_insert" on parameter_checks
  for insert with check (
    exists (select 1 from projects where projects.id = parameter_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "parameter_checks_update" on parameter_checks
  for update using (
    exists (select 1 from projects where projects.id = parameter_checks.project_id and projects.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects where projects.id = parameter_checks.project_id and projects.owner_id = auth.uid())
  );
create policy "parameter_checks_delete" on parameter_checks
  for delete using (
    exists (select 1 from projects where projects.id = parameter_checks.project_id and projects.owner_id = auth.uid())
  );

-- ---- dqs_runs / dqs_results / alert_log / weekly_reports ----
-- Replace the org-wide (and recursive) my_org_id() check with real
-- per-owner scoping. Only SELECT existed before — writes to these
-- tables only ever happen via the service-role worker, so no
-- insert/update/delete policy is added (default-deny for authenticated
-- is correct here).

drop policy if exists "dqs_runs_select" on dqs_runs;

create policy "dqs_runs_select" on dqs_runs
  for select using (
    exists (select 1 from projects where projects.id = dqs_runs.project_id and projects.owner_id = auth.uid())
  );

drop policy if exists "dqs_results_select" on dqs_results;

create policy "dqs_results_select" on dqs_results
  for select using (
    exists (
      select 1 from dqs_runs r
      join projects p on p.id = r.project_id
      where r.id = dqs_results.run_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "alert_log_select" on alert_log;

create policy "alert_log_select" on alert_log
  for select using (
    exists (select 1 from projects where projects.id = alert_log.project_id and projects.owner_id = auth.uid())
  );

drop policy if exists "weekly_reports_select" on weekly_reports;

create policy "weekly_reports_select" on weekly_reports
  for select using (
    exists (select 1 from projects where projects.id = weekly_reports.project_id and projects.owner_id = auth.uid())
  );

-- ---- profiles ----
-- profile_select previously allowed org_id = my_org_id() — since every
-- account shares one org_id, this exposed every user's row (including
-- ga4_access_token / ga4_refresh_token) to every other signed-in user,
-- and was the source of the my_org_id() -> profiles -> my_org_id()
-- recursion. A user only ever needs to see their own profile row.

drop policy if exists "profile_select" on profiles;

create policy "profile_select" on profiles
  for select using (id = auth.uid());
