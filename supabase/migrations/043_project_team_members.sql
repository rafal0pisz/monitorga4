-- ============================================================
-- GA4 Quality Score — Migration 043: per-project team access
-- ============================================================
-- Until now, an accepted team_members row granted visibility into EVERY one
-- of the owner's projects (my_accessible_owner_ids(), migration 024) — an
-- agency's team member could see every client's project name in their
-- sidebar, not just the ones they actually work on. This adds a per-project
-- grant layer on top: team_members still controls WHO is on the team (seats,
-- identity, invite lifecycle) and is otherwise unchanged; project_team_members
-- now controls WHICH of the owner's projects each accepted member can see at
-- all.
--
-- Backfill choice (confirmed with the product owner): every project the
-- owner has TODAY is granted to every already-accepted member, so no
-- existing team member silently loses access they're currently relying on.
-- Narrowing that down to only the projects someone actually works on is then
-- a manual step the owner takes afterward, per project/per person, not
-- something this migration forces on existing accounts.
--
-- References team_members.id (not member_id/auth.users) so a grant can be
-- recorded at invite time — before the invite is even accepted — and simply
-- takes effect the moment my_accessible_project_ids() starts counting that
-- membership (once accepted_at is set).

create table if not exists project_team_members (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  team_member_id  uuid not null references team_members(id) on delete cascade,
  granted_at      timestamptz not null default now(),
  unique (project_id, team_member_id)
);

create index if not exists project_team_members_project_idx on project_team_members (project_id);
create index if not exists project_team_members_member_idx  on project_team_members (team_member_id);

-- Locked down the same way as team_members itself (migration 024): writes
-- only ever go through the admin client (service_role) from API routes,
-- which own the actual business logic (ownership checks, seat limits).
-- Authenticated users can only ever SELECT grants that are actually theirs
-- to see — as the project's owner, or as the granted member themselves.
alter table project_team_members enable row level security;

drop policy if exists "project_team_members_select" on project_team_members;
create policy "project_team_members_select" on project_team_members
  for select using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
    or exists (select 1 from team_members tm where tm.id = team_member_id and tm.member_id = auth.uid())
  );

-- Backfill: every accepted member gets every project their owner has right
-- now. Safe to re-run (ON CONFLICT DO NOTHING) — rerunning this migration
-- (or a future one touching the same rows) never duplicates grants or
-- clobbers narrowing an owner has already done since.
insert into project_team_members (project_id, team_member_id)
select p.id, tm.id
from team_members tm
join projects p on p.owner_id = tm.owner_id
where tm.accepted_at is not null
on conflict (project_id, team_member_id) do nothing;

-- Every project id an authenticated user may access: their own, plus any
-- project an accepted team membership has been explicitly granted. Replaces
-- my_accessible_owner_ids() as the enforcement for actual project access —
-- that function still exists (migration 024) and is still used as-is for
-- "may this person create a new project under this owner's account", which
-- is a team-wide (not per-project) capability unaffected by this change.
create or replace function public.my_accessible_project_ids()
returns setof uuid
language sql
stable
as $function$
  select id from projects where owner_id = auth.uid()
  union
  select ptm.project_id
  from project_team_members ptm
  join team_members tm on tm.id = ptm.team_member_id
  where tm.member_id = auth.uid() and tm.accepted_at is not null
$function$;

-- ── Narrow projects RLS (migration 024) from account-wide to per-project ──
-- INSERT is deliberately left as my_accessible_owner_ids() — creating a NEW
-- project is still an account-wide capability (an accepted team member can
-- still add a project under the owner's account, same as today; see
-- app/dashboard/new/page.tsx), there's no existing project id to scope yet.
drop policy if exists "projects_select" on projects;
drop policy if exists "projects_update" on projects;
drop policy if exists "projects_delete" on projects;

create policy "projects_select" on projects
  for select using (id in (select my_accessible_project_ids()));

create policy "projects_update" on projects
  for update using (id in (select my_accessible_project_ids()))
  with check (id in (select my_accessible_project_ids()));

create policy "projects_delete" on projects
  for delete using (id in (select my_accessible_project_ids()));

-- ── Narrow the SECURITY DEFINER config RPCs the same way ──────────────────
-- Same reasoning as migration 024's widening: ProjectConfigForm calls these
-- directly from the browser, so this guard is the real enforcement, not
-- defense in depth.

create or replace function public.get_custom_event_checks(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY sort_order), '[]'::jsonb)
  INTO result FROM custom_event_checks t WHERE project_id = p_project_id;
  RETURN result;
END;
$function$;

create or replace function public.get_ecommerce_config(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result FROM ecommerce_config t WHERE project_id = p_project_id AND is_enabled = true;
  RETURN result;
END;
$function$;

create or replace function public.get_parameter_checks(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY event_name, sort_order), '[]'::jsonb)
  INTO result FROM parameter_checks t WHERE project_id = p_project_id;
  RETURN result;
END;
$function$;

create or replace function public.save_custom_event_checks(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM custom_event_checks WHERE project_id = p_project_id;
  IF jsonb_array_length(p_events) > 0 THEN
    INSERT INTO custom_event_checks (project_id, event_name, check_type, is_enabled, sort_order)
    SELECT p_project_id, e->>'event_name', e->>'check_type',
           (e->>'is_enabled')::boolean, (e->>'sort_order')::int
    FROM jsonb_array_elements(p_events) e;
  END IF;
END;
$function$;

create or replace function public.save_ecommerce_config(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM ecommerce_config WHERE project_id = p_project_id;
  IF jsonb_array_length(p_events) > 0 THEN
    INSERT INTO ecommerce_config (project_id, event_name, is_enabled, check_revenue, check_quantity, check_funnel)
    SELECT p_project_id, e->>'event_name', true, true, true, false
    FROM jsonb_array_elements(p_events) e;
  END IF;
END;
$function$;

create or replace function public.save_parameter_checks(p_project_id uuid, p_params jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND id IN (SELECT my_accessible_project_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM parameter_checks WHERE project_id = p_project_id;
  IF jsonb_array_length(p_params) > 0 THEN
    INSERT INTO parameter_checks (project_id, event_name, parameter_name, check_type, is_required, sort_order)
    SELECT p_project_id, p->>'event_name', p->>'parameter_name',
           'not_null', true, (p->>'sort_order')::int
    FROM jsonb_array_elements(p_params) p;
  END IF;
END;
$function$;

-- RPC the new "Team access" section on a project's Settings page uses to
-- show the account's team members with a has-access toggle for THIS
-- project. Owner-only (not exposed to members — only the owner manages
-- grants), same guard style as the RPCs above.
create or replace function public.get_project_team_access(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'team_member_id', tm.id,
    'email', tm.email,
    'accepted', tm.accepted_at IS NOT NULL,
    'has_access', ptm.id IS NOT NULL
  ) ORDER BY tm.invited_at), '[]'::jsonb)
  INTO result
  FROM team_members tm
  LEFT JOIN project_team_members ptm ON ptm.team_member_id = tm.id AND ptm.project_id = p_project_id
  WHERE tm.owner_id = (SELECT owner_id FROM projects WHERE id = p_project_id);
  RETURN result;
END;
$function$;
