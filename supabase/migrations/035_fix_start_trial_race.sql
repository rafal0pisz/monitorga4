-- Fixes a race in start_trial() found during a security re-audit: the
-- original (013_trial.sql) did a SELECT to check trial_used_at/plan_id,
-- then a separate UPDATE — two concurrent calls (double-click, two tabs)
-- could both pass the SELECT check before either UPDATE committed, both
-- then write, resulting in two welcome emails and trial_ends_at being
-- silently re-extended by the second call. Not a double-trial exploit
-- (same row, same final state), just a harmless-but-sloppy duplicate send.
--
-- Fix: fold the check into the UPDATE's WHERE clause so it's atomic at the
-- row level — Postgres serializes concurrent UPDATEs on the same row, so
-- the second caller's UPDATE only runs after the first one has committed,
-- and by then trial_used_at is no longer null, so it matches 0 rows.
create or replace function public.start_trial(p_owner_id uuid)
returns profiles
language plpgsql
security definer
as $function$
DECLARE
  v_row profiles;
BEGIN
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET plan_id = 'trial', trial_used_at = now(), trial_ends_at = now() + interval '14 days'
  WHERE id = p_owner_id AND trial_used_at IS NULL AND plan_id IS NULL
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    -- Lost the race (or genuinely already has a trial/plan) — re-read to
    -- report the right reason; the UPDATE above is what actually prevents
    -- the double-write, this is just picking the error message.
    SELECT * INTO v_row FROM profiles WHERE id = p_owner_id;
    IF v_row.plan_id IS NOT NULL AND v_row.plan_id <> 'trial' THEN
      RAISE EXCEPTION 'PLAN_ALREADY_ACTIVE';
    END IF;
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;

  RETURN v_row;
END;
$function$;
