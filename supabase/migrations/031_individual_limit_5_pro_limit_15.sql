-- ============================================================
-- GA4 Quality Score — Migration 031: Individual item limit back to 5,
-- Pro project limit lowered to 15
-- ============================================================
-- Reinstates the per-project item cap that migration 028 removed —
-- Individual is capped again at 5 custom events / e-commerce events /
-- parameter checks each, per project. Pro/Agency/trial/internal stay
-- unlimited, unchanged.
--
-- Also lowers Pro's GA4 property ceiling from 30 (set in migration 022)
-- to 15. Not retroactive either way: an existing project/config that's
-- already over its new limit is left as-is — only NEW project creation
-- (plan_project_limit, via create_project()) and NEW item saves
-- (plan_item_limit, via save_custom_event_checks/save_ecommerce_config/
-- save_parameter_checks) are blocked once a count already exceeds the new
-- ceiling. A current Pro account above 15 projects, or an Individual
-- project with more than 5 of any item type already configured, keeps
-- working as-is but can't add more until they're back under the limit.

create or replace function public.plan_item_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 5
    when 'pro' then 1000000
    when 'agency' then 1000000
    when 'trial' then 1000000
    when 'internal' then 1000000
    else 0
  end
$function$;

create or replace function public.plan_project_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 3
    when 'pro' then 15
    when 'agency' then 100
    when 'trial' then 100
    when 'internal' then 1000000
    else 0
  end
$function$;
