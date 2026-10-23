-- ============================================================
-- GA4 Quality Score — Migration 034: restore the item-limit check that
-- migration 024 silently dropped
-- ============================================================
-- Migration 024 (team members) redefined save_custom_event_checks(),
-- save_ecommerce_config() and save_parameter_checks() to add team-access
-- checking (my_accessible_owner_ids()) — but its new function bodies
-- never carried over the plan_item_limit() check that migration 013 had
-- added. Since migration 024 is the last one to touch these 3 functions,
-- that's the version that's been live ever since: the Lite plan's 5-item
-- cap (migration 031) changed the LIMIT VALUE but nothing has actually
-- enforced it at the database level since 024 shipped. Found during a
-- security review, 2026-10-23.
--
-- This redefines all 3 functions with BOTH checks combined: team access
-- (024) and the plan's item limit (013), resolved through
-- effective_plan_id() so an owner's actual current plan is checked, not
-- just profiles.plan_id directly (matching how create_project() does it).

create or replace function public.save_custom_event_checks(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
  v_owner_id uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
  SELECT plan_item_limit(effective_plan_id(v_owner_id)) INTO v_limit;

  IF jsonb_array_length(p_events) > v_limit THEN
    RAISE EXCEPTION 'ITEM_LIMIT_REACHED';
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
DECLARE
  v_limit int;
  v_owner_id uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
  SELECT plan_item_limit(effective_plan_id(v_owner_id)) INTO v_limit;

  IF jsonb_array_length(p_events) > v_limit THEN
    RAISE EXCEPTION 'ITEM_LIMIT_REACHED';
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
DECLARE
  v_limit int;
  v_owner_id uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id IN (SELECT my_accessible_owner_ids())
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
  SELECT plan_item_limit(effective_plan_id(v_owner_id)) INTO v_limit;

  IF jsonb_array_length(p_params) > v_limit THEN
    RAISE EXCEPTION 'ITEM_LIMIT_REACHED';
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
