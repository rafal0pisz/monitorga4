-- ============================================================
-- GA4 Quality Score — Migration 029: track cancel_at_period_end
-- ============================================================
-- Stripe's own hosted billing portal lets a customer cancel "at period
-- end" without an immediate customer.subscription.deleted event — Stripe
-- just flips cancel_at_period_end on the live subscription.updated event
-- and keeps subscription_status as 'active' until the period actually
-- ends. Until now the app never stored or showed that flag, so the
-- billing page looked identical whether someone had canceled or not —
-- they'd only find out from Stripe's own email. This column lets the
-- billing page show "canceled, active until <date>" explicitly.

alter table profiles add column if not exists cancel_at_period_end boolean not null default false;
