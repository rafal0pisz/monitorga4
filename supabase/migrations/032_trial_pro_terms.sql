-- ============================================================
-- GA4 Quality Score — Migration 032: trial now runs on Pro terms, not Agency
-- ============================================================
-- Lowers the trial's GA4 property ceiling from 100 (Agency-level, set in
-- migration 013) to 15, matching Pro's current limit (migration 031). The
-- trial's item limit (custom events/e-commerce/parameters per project)
-- stays unlimited — Pro itself is unlimited there, so plan_item_limit()
-- needs no change.

create or replace function public.plan_project_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 3
    when 'pro' then 15
    when 'agency' then 100
    when 'trial' then 15
    when 'internal' then 1000000
    else 0
  end
$function$;
