-- ============================================================
-- GA4 Quality Score — Migration 025: team-aware create_project()
-- ============================================================
-- Migration 024 widened projects' own RLS and the get_*/save_*_checks RPCs
-- to accept an accepted team member, but missed create_project() (migration
-- 011) — it has its own hard check requiring auth.uid() = p_owner_id, which
-- would reject a team member creating a new project under the Agency
-- owner's account (the only account that actually has the plan/limit to
-- create against). Same swap as migration 024: strict self-match becomes
-- "any owner_id this caller may act as".
--
-- Purely additive in effect: for every account with no team, my_accessible_
-- owner_ids() still resolves to exactly {auth.uid()}, so this check is
-- identical to the old one for every existing user.

create or replace function public.create_project(
  p_owner_id uuid,
  p_name text,
  p_ga4_property_id text,
  p_own_domain text,
  p_expected_events text[],
  p_alert_threshold int,
  p_alert_email text
)
returns projects
language plpgsql
security definer
as $function$
DECLARE
  v_limit int;
  v_count int;
  v_row projects;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM my_accessible_owner_ids() oid WHERE oid = p_owner_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT plan_project_limit(plan_id) INTO v_limit FROM profiles WHERE id = p_owner_id;
  SELECT count(*) INTO v_count FROM projects WHERE owner_id = p_owner_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED';
  END IF;

  INSERT INTO projects (org_id, owner_id, name, ga4_property_id, own_domain, expected_events, alert_threshold, alert_email, ga4_auth_type)
  VALUES ('00000000-0000-0000-0000-000000000001', p_owner_id, p_name, p_ga4_property_id, p_own_domain, p_expected_events, p_alert_threshold, p_alert_email, 'oauth')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;
