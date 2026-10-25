-- ============================================================
-- GA4 Quality Score — Migration 041: track whether alert emails actually sent
-- ============================================================
-- alert_log/critical_alert_log recorded that a send was ATTEMPTED (used as
-- the once-per-day dedup gate in app/api/worker/run/route.ts), but never
-- whether Resend actually delivered it — sendEmail()'s success/failure
-- return value was simply discarded. The internal daily ops digest
-- (src/lib/email/ownerDigest.ts) needs this to honestly report "did client
-- emails go out", not just "did the check run complete".

alter table alert_log add column if not exists email_sent boolean;
alter table critical_alert_log add column if not exists email_sent boolean;
