-- ============================================================
-- GA4 Quality Score — Migration 033: rename plan 'individual' -> 'lite'
-- ============================================================
-- Renames the plan_id value itself, not just its display label (shown in
-- the app as "Individual", now "Lite"). Three things, in order:
--
-- 1. Backfill every existing profiles row first — this MUST run before the
--    functions below are redefined, otherwise any account still holding
--    plan_id='individual' would stop matching either function's CASE
--    statement the instant this migration finishes, falling through to
--    the `else 0` branch and silently losing all project/item allowance
--    (a paying customer's service would look exactly like having no plan
--    at all). Running the backfill first means there is no window where
--    that mismatch can happen.
-- 2. Redefine plan_item_limit() with 'lite' in place of 'individual'
--    (same value, 5 — unchanged from migration 031).
-- 3. Redefine plan_project_limit() with 'lite' in place of 'individual'
--    (same value, 3 — unchanged since migration 011).
--
-- NOT covered by this migration, requires manual action:
--   - Stripe's own Product name is still "Individual" — Stripe Checkout
--     and invoices read that directly from Stripe, not from this app's
--     code, so it must be renamed to "Lite" in the Stripe Dashboard
--     (Products) separately, or checkout/invoices will keep showing
--     "Individual" even though the app now says "Lite" everywhere.
--   - The STRIPE_PRICE_INDIVIDUAL_MONTHLY/YEARLY env var NAMES are left
--     unchanged on purpose — they're arbitrary internal Vercel variable
--     names with no user-facing meaning, still pointing at the same
--     Stripe Price objects as before.

update profiles set plan_id = 'lite' where plan_id = 'individual';

create or replace function public.plan_item_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'lite' then 5
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
    when 'lite' then 3
    when 'pro' then 15
    when 'agency' then 100
    when 'trial' then 15
    when 'internal' then 1000000
    else 0
  end
$function$;
