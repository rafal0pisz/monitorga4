-- ============================================================
-- GA4 Quality Score — Migration 045: default groups, group-at-creation
-- ============================================================
-- Two changes, both aimed at "every project should always be in a group,
-- not just newly organized ones going forward":
--
-- 1. Backfill: every account's currently-ungrouped projects are moved into
--    a "GROUP - Default" group (created per owner if they don't have one
--    yet). Applies to every plan, not just Pro/Agency — grouping is an
--    organizational feature on its own, independent of whether the
--    account can actually grant team access to it. Idempotent: once a
--    project has a group_id, this does nothing to it on a re-run.
--
-- 2. create_project() now takes an optional p_group_id. The actual
--    "require a choice in the wizard" UX lives in the app (NewProjectForm/
--    the new-project page), not here — but even if some future caller of
--    this RPC omits it, the function itself falls back to that owner's
--    "GROUP - Default" (creating it if needed) rather than ever leaving a
--    newly created project ungrouped. Everything else about this function
--    is copied verbatim from migration 025 (the current definition) —
--    only the group handling and the new INSERT column are new.

insert into project_groups (owner_id, name)
select distinct p.owner_id, 'GROUP - Default'
from projects p
where p.group_id is null
on conflict (owner_id, name) do nothing;

update projects p
set group_id = g.id
from project_groups g
where p.group_id is null
  and g.owner_id = p.owner_id
  and g.name = 'GROUP - Default';

create or replace function public.create_project(
  p_owner_id uuid,
  p_name text,
  p_ga4_property_id text,
  p_own_domain text,
  p_expected_events text[],
  p_alert_threshold int,
  p_alert_email text,
  p_group_id uuid default null
)
returns projects
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
  v_count int;
  v_row projects;
  v_group_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM my_accessible_owner_ids() oid WHERE oid = p_owner_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT plan_project_limit(plan_id) INTO v_limit FROM profiles WHERE id = p_owner_id;
  SELECT count(*) INTO v_count FROM projects WHERE owner_id = p_owner_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED';
  END IF;

  v_group_id := p_group_id;
  IF v_group_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM project_groups WHERE id = v_group_id AND owner_id = p_owner_id) THEN
      RAISE EXCEPTION 'Invalid group';
    END IF;
  ELSE
    SELECT id INTO v_group_id FROM project_groups WHERE owner_id = p_owner_id AND name = 'GROUP - Default';
    IF v_group_id IS NULL THEN
      INSERT INTO project_groups (owner_id, name) VALUES (p_owner_id, 'GROUP - Default') RETURNING id INTO v_group_id;
    END IF;
  END IF;

  INSERT INTO projects (org_id, owner_id, name, ga4_property_id, own_domain, expected_events, alert_threshold, alert_email, ga4_auth_type, group_id)
  VALUES ('00000000-0000-0000-0000-000000000001', p_owner_id, p_name, p_ga4_property_id, p_own_domain, p_expected_events, p_alert_threshold, p_alert_email, 'oauth', v_group_id)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

-- Lets the new-project wizard list (and offer to create) groups for
-- whichever account the new project will belong to (own, or a team
-- owner's — see create_project's p_owner_id above) before the project
-- exists yet. Same ownership check as create_project.
create or replace function public.list_project_groups(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM my_accessible_owner_ids() oid WHERE oid = p_owner_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name) ORDER BY name), '[]'::jsonb)
  INTO result FROM project_groups WHERE owner_id = p_owner_id;
  RETURN result;
END;
$function$;
