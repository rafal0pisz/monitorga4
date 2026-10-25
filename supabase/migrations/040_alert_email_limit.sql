-- ============================================================
-- GA4 Quality Score — Migration 040: limit on alert-recipient addresses
-- ============================================================
-- Lite projects may list up to 2 addresses in alert_email or
-- critical_alert_email; Pro/Agency/Trial up to 5; Internal unbounded.
-- ProjectConfigForm/NewProjectForm update `projects` directly from the
-- browser (migration 024's comment on projects_update RLS), so this is
-- enforced with a trigger on the table itself, not only in the UI —
-- otherwise a direct REST/SQL write could just skip the client-side check.
--
-- The trigger only blocks a field from INCREASING past the limit — it
-- never fails an update that leaves alert_email/critical_alert_email
-- unchanged or shorter, so an account that downgraded plans while already
-- over the new cap can still save the rest of its project settings.
--
-- SECURITY DEFINER: a team member (not the project's owner_id) can also
-- update a shared project per the 024 RLS policy, but would otherwise be
-- blocked from reading the owner's profiles row by that table's own RLS.
-- This mirrors how save_custom_event_checks() etc. (migration 034) read
-- effective_plan_id() for the real owner regardless of who's editing.

create or replace function public.plan_alert_email_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'internal' then 1000000
    when 'trial' then 5
    when 'pro' then 5
    when 'agency' then 5
    else 2  -- lite, and any unknown/no-plan state
  end
$function$;

create or replace function public.enforce_alert_email_limits()
returns trigger
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
  v_alert_count int;
  v_critical_count int;
  v_old_alert_count int;
  v_old_critical_count int;
BEGIN
  SELECT plan_alert_email_limit(effective_plan_id(NEW.owner_id)) INTO v_limit;

  SELECT count(*) INTO v_alert_count FROM (
    SELECT DISTINCT trim(e) AS addr
    FROM regexp_split_to_table(coalesce(NEW.alert_email, ''), '[,;\s]+') AS e
    WHERE trim(e) <> ''
  ) s;

  SELECT count(*) INTO v_critical_count FROM (
    SELECT DISTINCT trim(e) AS addr
    FROM regexp_split_to_table(coalesce(NEW.critical_alert_email, ''), '[,;\s]+') AS e
    WHERE trim(e) <> ''
  ) s;

  IF TG_OP = 'UPDATE' THEN
    SELECT count(*) INTO v_old_alert_count FROM (
      SELECT DISTINCT trim(e) AS addr
      FROM regexp_split_to_table(coalesce(OLD.alert_email, ''), '[,;\s]+') AS e
      WHERE trim(e) <> ''
    ) s;
    SELECT count(*) INTO v_old_critical_count FROM (
      SELECT DISTINCT trim(e) AS addr
      FROM regexp_split_to_table(coalesce(OLD.critical_alert_email, ''), '[,;\s]+') AS e
      WHERE trim(e) <> ''
    ) s;
  ELSE
    v_old_alert_count := 0;
    v_old_critical_count := 0;
  END IF;

  IF v_alert_count > v_limit AND v_alert_count > v_old_alert_count THEN
    RAISE EXCEPTION 'ALERT_EMAIL_LIMIT_REACHED';
  END IF;

  IF v_critical_count > v_limit AND v_critical_count > v_old_critical_count THEN
    RAISE EXCEPTION 'ALERT_EMAIL_LIMIT_REACHED';
  END IF;

  RETURN NEW;
END;
$function$;

drop trigger if exists enforce_alert_email_limits on projects;
create trigger enforce_alert_email_limits
  before insert or update on projects
  for each row execute function public.enforce_alert_email_limits();
