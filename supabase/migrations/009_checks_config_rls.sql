-- ============================================================
-- GA4 Quality Score — Migration 009: enable RLS on checks_config
-- ============================================================
-- Supabase's security advisor flagged checks_config as
-- "rls_disabled_in_public" (critical): migration 004 created a
-- "using (true)" policy on it but never ran ENABLE ROW LEVEL SECURITY,
-- so the policy was never actually enforced — the table was fully
-- open to anyone with the anon key, with no ownership check at all.
--
-- The app only ever reads checks_config through createAdminClient()
-- (service role) server-side, so this can be locked down to the same
-- owner-based model as `projects` without touching any app code.

-- drop-if-exists guards on all 5 policy names (not just the old one) so
-- this can be safely re-run — needed in practice: this migration file sat
-- unapplied against production for a while (same as 020), so the advisor
-- was still reporting checks_config as fully open right up until this was
-- actually pasted into the SQL editor.

alter table checks_config enable row level security;

drop policy if exists "checks_config_all" on checks_config;
drop policy if exists "checks_config_select" on checks_config;
drop policy if exists "checks_config_insert" on checks_config;
drop policy if exists "checks_config_update" on checks_config;
drop policy if exists "checks_config_delete" on checks_config;

create policy "checks_config_select" on checks_config
  for select using (
    exists (
      select 1 from projects
      where projects.id = checks_config.project_id and projects.owner_id = auth.uid()
    )
  );

create policy "checks_config_insert" on checks_config
  for insert with check (
    exists (
      select 1 from projects
      where projects.id = checks_config.project_id and projects.owner_id = auth.uid()
    )
  );

create policy "checks_config_update" on checks_config
  for update using (
    exists (
      select 1 from projects
      where projects.id = checks_config.project_id and projects.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from projects
      where projects.id = checks_config.project_id and projects.owner_id = auth.uid()
    )
  );

create policy "checks_config_delete" on checks_config
  for delete using (
    exists (
      select 1 from projects
      where projects.id = checks_config.project_id and projects.owner_id = auth.uid()
    )
  );
