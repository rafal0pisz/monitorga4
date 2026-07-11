-- ============================================================
-- GA4 Quality Score — Migration 014: trial-ending-soon reminder tracking
-- ============================================================
-- Marks when the "trial ends in 2 days" email was sent for a given trial,
-- so the daily reminder cron (app/api/worker/trial-reminders) doesn't send
-- it more than once per trial.

alter table profiles add column if not exists trial_reminder_sent_at timestamptz;
