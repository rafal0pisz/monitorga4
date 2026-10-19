-- ============================================================
-- GA4 Quality Score — Migration 028: Individual item limit removed
-- ============================================================
-- Individual no longer caps custom events, e-commerce events, or parameter
-- checks per project — matches Pro/Agency/trial/internal. Decided this
-- doesn't meaningfully affect resource usage, so the per-item cap (5, set
-- in migration 016) isn't worth the confusion it causes. Same function
-- shape as migrations 012/013/016 — redefined in full since only the
-- 'individual' case value changes.

create or replace function public.plan_item_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 1000000
    when 'pro' then 1000000
    when 'agency' then 1000000
    when 'trial' then 1000000
    when 'internal' then 1000000
    else 0
  end
$function$;
