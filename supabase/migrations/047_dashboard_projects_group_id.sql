-- ============================================================
-- GA4 Quality Score — Migration 047: group_id on dashboard_projects
-- ============================================================
-- The sidebar/dashboard project lists now nest projects under their group
-- (see src/components/layout/SidebarNav.tsx, app/dashboard/page.tsx), but
-- dashboard_projects (migration 017) never exposed projects.group_id.
-- CREATE OR REPLACE VIEW keeps every existing column name/order/type
-- identical and only appends group_id at the end — any existing caller
-- that reads this view by column name is unaffected; one that destructured
-- it positionally (none do today) would see the new trailing column.

create or replace view public.dashboard_projects as
SELECT p.id,
   p.org_id,
   p.owner_id,
   p.name,
   p.ga4_property_id,
   p.status,
   p.alert_threshold,
   p.share_token,
   lr.run_date AS last_run_date,
   lr.score_total AS last_score,
   lr.run_status,
   prev.score_total AS prev_week_score,
   p.alert_email,
   p.auto_run,
   (SELECT count(*) FROM custom_event_checks c WHERE c.project_id = p.id AND c.is_enabled) AS custom_events_count,
   (SELECT count(*) FROM ecommerce_config e WHERE e.project_id = p.id AND e.is_enabled) AS ecommerce_events_count,
   (SELECT count(*) FROM parameter_checks pc WHERE pc.project_id = p.id) AS parameter_checks_count,
   p.group_id
  FROM projects p
    LEFT JOIN project_latest_run lr ON lr.project_id = p.id
    LEFT JOIN LATERAL ( SELECT dqs_runs.score_total
          FROM dqs_runs
         WHERE dqs_runs.project_id = p.id AND dqs_runs.status = 'completed'::run_status AND dqs_runs.run_date <= (lr.run_date - '7 days'::interval)
         ORDER BY dqs_runs.run_date DESC
        LIMIT 1) prev ON true;

-- CREATE OR REPLACE VIEW should preserve this, but re-asserting it is
-- harmless and removes any doubt — this view must stay security_invoker
-- (migration 021) so it's bound by the querying user's own RLS, not the
-- view owner's.
alter view public.dashboard_projects set (security_invoker = on);
