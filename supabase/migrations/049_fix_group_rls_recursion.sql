-- ============================================================
-- GA4 Quality Score — Migration 049: fix RLS infinite recursion
-- ============================================================
-- Bug: "infinite recursion detected in policy for relation
-- 'group_team_members'" when saving a project's settings (the Alert
-- email(s) / threshold / auto_run form — ProjectConfigForm.tsx).
--
-- Root cause (migration 044): project_groups_select and
-- group_team_members_select each query the OTHER RLS-protected table in
-- an EXISTS subquery:
--   project_groups_select     -> queries group_team_members
--   group_team_members_select -> queries project_groups
-- Both tables have RLS enabled, so evaluating either policy as a real
-- (non-owner) role forces Postgres to evaluate the other table's policy
-- too, which queries back into the first table — forever.
--
-- This sat latent because almost every read of these two tables goes
-- through the admin (service_role) client, which bypasses RLS entirely,
-- or through the SECURITY DEFINER config RPCs (get/save_* for custom
-- events, ecommerce, parameters) whose nested call into
-- my_accessible_project_ids() already runs as the function's owner (also
-- RLS-exempt, since SECURITY DEFINER changes the effective role for
-- everything executed inside, including functions it calls). The one path
-- that doesn't go through either is "Save settings" itself: it updates
-- `projects` directly with the browser's own (non-admin) client, which
-- hits the projects_update policy's `id in (select
-- my_accessible_project_ids())` check — and my_accessible_project_ids()
-- was a plain (non-definer) SQL function, so THIS call runs as the real,
-- RLS-bound authenticated user and walks straight into the cycle.
--
-- Fix, in two parts:
--
-- 1) Make my_accessible_project_ids() SECURITY DEFINER. Its body already
--    fully encodes the access boundary itself (every branch is scoped to
--    auth.uid()), so running its internal lookups as the function's owner
--    (RLS-exempt on tables it owns, exactly like the config RPCs already
--    assume) is safe — no additional data becomes reachable, it just
--    stops re-triggering other tables' RLS policies while resolving its
--    own answer. This fixes the actually-reported bug.
--
-- 2) Route project_groups_select and group_team_members_select through
--    two small SECURITY DEFINER helper functions instead of querying each
--    other's table directly, so the cycle can't be re-introduced by some
--    other future caller that queries either table directly with a
--    non-admin client.
--
-- Safe to re-run.

create or replace function public.my_accessible_project_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $function$
  select id from projects where owner_id = auth.uid()
  union
  select p.id
  from projects p
  join group_team_members gtm on gtm.group_id = p.group_id
  join team_members tm on tm.id = gtm.team_member_id
  where tm.member_id = auth.uid() and tm.accepted_at is not null
$function$;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1 from project_groups where id = p_group_id and owner_id = auth.uid()
  )
$function$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from group_team_members gtm
    join team_members tm on tm.id = gtm.team_member_id
    where gtm.group_id = p_group_id and tm.member_id = auth.uid() and tm.accepted_at is not null
  )
$function$;

drop policy if exists "project_groups_select" on project_groups;
create policy "project_groups_select" on project_groups
  for select using (
    owner_id = auth.uid()
    or is_group_member(id)
  );

drop policy if exists "group_team_members_select" on group_team_members;
create policy "group_team_members_select" on group_team_members
  for select using (
    is_group_owner(group_id)
    or exists (select 1 from team_members tm where tm.id = team_member_id and tm.member_id = auth.uid())
  );
