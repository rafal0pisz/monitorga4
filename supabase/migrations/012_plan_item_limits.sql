-- ============================================================
-- GA4 Quality Score — Migration 012: per-project item limits (plan-gated)
-- ============================================================
-- Individual plan caps custom events, e-commerce events, and parameter
-- checks at 10 each per project. Pro/Agency/internal stay unlimited.
-- Mirrors the plan_project_limit() pattern from migration 011, but this
-- limit is per-project item count rather than per-account project count.

create or replace function public.plan_item_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 10
    when 'pro' then 1000000
    when 'agency' then 1000000
    when 'internal' then 1000000
    else 0
  end
$function$;

create or replace function public.save_custom_event_checks(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT plan_item_limit(profiles.plan_id) INTO v_limit
  FROM projects JOIN profiles ON profiles.id = projects.owner_id
  WHERE projects.id = p_project_id;

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
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT plan_item_limit(profiles.plan_id) INTO v_limit
  FROM projects JOIN profiles ON profiles.id = projects.owner_id
  WHERE projects.id = p_project_id;

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
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;

  SELECT plan_item_limit(profiles.plan_id) INTO v_limit
  FROM projects JOIN profiles ON profiles.id = projects.owner_id
  WHERE projects.id = p_project_id;

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
