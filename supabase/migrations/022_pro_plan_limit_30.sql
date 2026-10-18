-- ============================================================
-- GA4 Quality Score — Migration 022: Pro plan limit 10 -> 30
-- ============================================================
-- Raises the Pro plan's project (GA4 service) ceiling from 10 to 30 at the
-- same price. Re-defines plan_project_limit() exactly as migration 013
-- left it, with only the 'pro' case changed — every other plan's limit is
-- untouched.

create or replace function public.plan_project_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 3
    when 'pro' then 30
    when 'agency' then 100
    when 'trial' then 100
    when 'internal' then 1000000
    else 0
  end
$function$;
