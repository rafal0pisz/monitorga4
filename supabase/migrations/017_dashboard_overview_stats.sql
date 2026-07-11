-- ============================================================
-- GA4 Quality Score — Migration 017: overview stats on dashboard_projects
-- ============================================================
-- Adds alert_email, auto_run, and per-project check counts to the
-- dashboard_projects view so the Overview page and "All projects" list can
-- show email-alert / daily-check status and custom-event / e-commerce /
-- parameter counts at a glance, without a separate query per project.
-- CREATE OR REPLACE VIEW can only append columns at the end (not insert
-- mid-list) — same as migration 007 — so this DROPs the view first.

drop view if exists dashboard_projects;

create view dashboard_projects as
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
    (SELECT count(*) FROM parameter_checks pc WHERE pc.project_id = p.id) AS parameter_checks_count
   FROM projects p
     LEFT JOIN project_latest_run lr ON lr.project_id = p.id
     LEFT JOIN LATERAL ( SELECT dqs_runs.score_total
           FROM dqs_runs
          WHERE dqs_runs.project_id = p.id AND dqs_runs.status = 'completed'::run_status AND dqs_runs.run_date <= (lr.run_date - '7 days'::interval)
          ORDER BY dqs_runs.run_date DESC
         LIMIT 1) prev ON true;
