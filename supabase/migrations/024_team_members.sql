-- ============================================================
-- GA4 Quality Score — Migration 024: team membership (Agency plan), step 1
-- ============================================================
-- Foundation for multi-user access on the Agency plan. Adds the
-- membership table and widens EVERY existing ownership check that gates
-- project access — both projects' own RLS policies (migration 007) and
-- the SECURITY DEFINER config RPCs (also migration 007, which run with
-- the function owner's privileges and bypass RLS entirely, so they check
-- ownership themselves) — to also accept an accepted team member, not
-- just the project's own owner_id.
--
-- Purely additive: team_members starts empty, so my_accessible_owner_ids()
-- returns exactly {auth.uid()} for everyone until invites exist AND are
-- accepted — today's behavior for every existing account is unchanged.
-- The invite UI/API that actually populates this table is a separate,
-- later step. This migration only needs to be safe to run on its own,
-- with no UI yet pointed at it.

create table if not exists team_members (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  member_id     uuid references auth.users(id) on delete cascade,
  email         text not null,
  role          text not null default 'member' check (role in ('admin','member')),
  invite_token  uuid not null default gen_random_uuid(),
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  unique (owner_id, email)
);

create index if not exists team_members_owner_idx  on team_members (owner_id);
create index if not exists team_members_member_idx on team_members (member_id);

-- Locked down like app_config (migration 003): writes go only through the
-- admin client (service_role) from a future invite/accept/remove API
-- route — never directly from the browser, since inviting needs business
-- logic (Agency-plan check, seat limit) that doesn't belong in RLS.
-- Authenticated users can only ever SELECT their own team's rows: as the
-- owner (every member/pending invite) or as an accepted member (their own
-- membership row only).
alter table team_members enable row level security;

drop policy if exists "team_members_select" on team_members;
create policy "team_members_select" on team_members
  for select using (owner_id = auth.uid() or member_id = auth.uid());

-- Every owner_id an authenticated user may act as: themselves, plus any
-- owner whose team they've been added to and have accepted. Used both by
-- table RLS (projects, below) and by the SECURITY DEFINER RPCs that
-- bypass RLS entirely.
create or replace function public.my_accessible_owner_ids()
returns setof uuid
language sql
stable
as $function$
  select auth.uid()
  union
  select owner_id from team_members
  where member_id = auth.uid() and accepted_at is not null
$function$;

-- ── Widen projects RLS (migration 007) to accepted team members ──────
-- ProjectConfigForm deletes/updates `projects` directly from the browser
-- (not through an API route), so this table's own RLS is the real
-- enforcement for that form — not just defense in depth.
drop policy if exists "projects_select" on projects;
drop policy if exists "projects_insert" on projects;
drop policy if exists "projects_update" on projects;
drop policy if exists "projects_delete" on projects;

create policy "projects_select" on projects
  for select using (owner_id in (select my_accessible_owner_ids()));

create policy "projects_insert" on projects
  for insert with check (owner_id in (select my_accessible_owner_ids()));

create policy "projects_update" on projects
  for update using (owner_id in (select my_accessible_owner_ids()))
  with check (owner_id in (select my_accessible_owner_ids()));

create policy "projects_delete" on projects
  for delete using (owner_id in (select my_accessible_owner_ids()));

-- ── Widen the SECURITY DEFINER config RPCs the same way ──────────────
-- ProjectConfigForm / NewProjectForm call these directly from the
-- browser. Without this, an accepted team member could see/edit a shared
-- project everywhere EXCEPT its custom events/ecommerce/parameter
-- config, which would silently fail there instead of working "like the
-- owner" as intended.

create or replace function public.get_custom_event_checks(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
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
