-- ============================================================
-- GA4 Quality Score — Migration 015: onboarding checklist dismissal
-- ============================================================
-- Lets a user permanently hide the dashboard onboarding checklist without
-- having to complete every step first.

alter table profiles add column if not exists onboarding_dismissed_at timestamptz;
