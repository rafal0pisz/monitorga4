-- ============================================================
-- GA4 Quality Score — Migration 004: Fix RLS policies
-- ============================================================

-- Pozwól na update i delete projektów (tymczasowo bez ograniczeń — MVP wewnętrzny)
drop policy if exists "projects_update" on projects;
drop policy if exists "projects_delete" on projects;

create policy "projects_update" on projects
  for update using (true) with check (true);

create policy "projects_delete" on projects
  for delete using (true);

-- Pozwól na upsert checks_config
drop policy if exists "checks_config_all" on checks_config;

create policy "checks_config_all" on checks_config
  for all using (true) with check (true);
