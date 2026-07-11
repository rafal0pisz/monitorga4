-- ============================================================
-- GA4 Quality Score — Migration 013: 14-day free trial (no card)
-- ============================================================
-- Adds a one-time, self-serve trial on Agency-level terms. A trial is only
-- offered to accounts with no plan at all (plan_id is null) — this also
-- naturally excludes 'internal' (Bettersteps' own) accounts, which already
-- have unlimited access and should never be able to downgrade themselves
-- into a time-limited trial by mistake.

alter table profiles add column if not exists trial_ends_at timestamptz;
alter table profiles add column if not exists trial_used_at timestamptz;

-- Trial gets Agency's limits while active (same ceiling, not a separate tier).
create or replace function public.plan_project_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 3
    when 'pro' then 10
    when 'agency' then 100
    when 'trial' then 100
    when 'internal' then 1000000
    else 0
  end
$function$;

create or replace function public.plan_item_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 10
    when 'pro' then 1000000
    when 'agency' then 1000000
    when 'trial' then 1000000
    when 'internal' then 1000000
    else 0
  end
$function$;

-- Resolves what plan_id should actually count for limit purposes right now
-- — an expired trial reverts to "no plan" (limit 0) without needing a cron
-- job to go back and rewrite the row. profiles.plan_id itself is left as
-- 'trial' after expiry purely as a historical record of what happened.
create or replace function public.effective_plan_id(p_owner_id uuid)
returns text
language plpgsql
stable
as $function$
DECLARE
  v_plan_id text;
  v_trial_ends_at timestamptz;
BEGIN
  SELECT plan_id, trial_ends_at INTO v_plan_id, v_trial_ends_at
  FROM profiles WHERE id = p_owner_id;

  IF v_plan_id = 'trial' AND (v_trial_ends_at IS NULL OR v_trial_ends_at < now()) THEN
    RETURN NULL;
  END IF;

  RETURN v_plan_id;
END;
$function$;

create or replace function public.start_trial(p_owner_id uuid)
returns profiles
language plpgsql
security definer
as $function$
DECLARE
  v_row profiles;
BEGIN
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_row FROM profiles WHERE id = p_owner_id;

  IF v_row.trial_used_at IS NOT NULL THEN
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;
  IF v_row.plan_id IS NOT NULL THEN
    RAISE EXCEPTION 'PLAN_ALREADY_ACTIVE';
  END IF;

  UPDATE profiles
  SET plan_id = 'trial', trial_used_at = now(), trial_ends_at = now() + interval '14 days'
  WHERE id = p_owner_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

-- ============================================================
-- Re-point the plan-gated RPCs at effective_plan_id() so an expired trial
-- is treated as no plan, not as a still-live Agency-sized allowance.
-- ============================================================
create or replace function public.create_project(
  p_owner_id uuid,
  p_name text,
  p_ga4_property_id text,
  p_own_domain text,
  p_expected_events text[],
  p_alert_threshold int,
  p_alert_email text
)
returns projects
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
  v_count int;
  v_row projects;
BEGIN
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT plan_project_limit(effective_plan_id(p_owner_id)) INTO v_limit;
  SELECT count(*) INTO v_count FROM projects WHERE owner_id = p_owner_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED';
  END IF;

  INSERT INTO projects (org_id, owner_id, name, ga4_property_id, own_domain, expected_events, alert_threshold, alert_email, ga4_auth_type)
  VALUES ('00000000-0000-0000-0000-000000000001', p_owner_id, p_name, p_ga4_property_id, p_own_domain, p_expected_events, p_alert_threshold, p_alert_email, 'oauth')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
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
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
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
