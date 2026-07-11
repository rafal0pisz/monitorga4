-- ============================================================
-- GA4 Quality Score — Migration 016: lower Individual's item limit to 5
-- ============================================================
-- Individual now caps custom events, e-commerce events, and parameter
-- checks at 5 each per project (was 10). Pro/Agency/trial/internal stay
-- unlimited. Same function as migration 012/013 — redefined in full here
-- since only the 'individual' case value changes.

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
