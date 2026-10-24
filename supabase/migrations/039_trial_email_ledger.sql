-- ============================================================
-- GA4 Quality Score — Migration 039: block trial re-use via account deletion
-- ============================================================
-- app/api/account/delete/route.ts hard-deletes both the profiles row and
-- the auth.users row. start_trial() only ever checked profiles.trial_used_at
-- on that row, so deleting an account and signing back in with the same
-- Google email creates a brand-new profiles.id with trial_used_at = null,
-- silently resetting trial eligibility — an unlimited free-trial loop.
--
-- Fix: a separate ledger table, keyed by lowercased email, that the account
-- deletion route never touches and that nothing ever deletes from. Once an
-- email has used a trial, it has used its trial, regardless of how many
-- times the account behind it is deleted and recreated.

create table if not exists used_trial_emails (
  email_lower text primary key,
  used_at timestamptz not null default now(),
  -- Kept only for support lookups ("why can't I start a trial") — not used
  -- for the eligibility check itself, which is keyed on email_lower alone.
  first_profile_id uuid
);

alter table used_trial_emails enable row level security;
-- No policies = no access via the anon/authenticated key (same convention
-- as trial_winback_responses/billing_events) — only start_trial() below
-- (security definer) and has_used_trial_email() ever touch this table.

create or replace function public.start_trial(p_owner_id uuid)
returns profiles
language plpgsql
security definer
as $function$
DECLARE
  v_row profiles;
  v_email text;
  v_ledger_email text;
BEGIN
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO v_email FROM profiles WHERE id = p_owner_id;

  IF v_email IS NOT NULL THEN
    -- Atomic claim on the email, mirroring the row-level atomicity fix in
    -- 035: if two requests race for the same email, only one INSERT wins,
    -- so only one of them can proceed to actually grant the trial below.
    INSERT INTO used_trial_emails (email_lower, first_profile_id)
    VALUES (lower(v_email), p_owner_id)
    ON CONFLICT (email_lower) DO NOTHING
    RETURNING email_lower INTO v_ledger_email;

    IF v_ledger_email IS NULL THEN
      RAISE EXCEPTION 'TRIAL_ALREADY_USED';
    END IF;
  END IF;

  UPDATE profiles
  SET plan_id = 'trial', trial_used_at = now(), trial_ends_at = now() + interval '14 days'
  WHERE id = p_owner_id AND trial_used_at IS NULL AND plan_id IS NULL
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    -- Lost the per-row race (or genuinely already has a trial/plan on this
    -- exact profile row). The email-ledger INSERT above already committed
    -- in this case, which is fine: this profile row already owns that
    -- email's one trial, it just can't double-grant itself.
    SELECT * INTO v_row FROM profiles WHERE id = p_owner_id;
    IF v_row.plan_id IS NOT NULL AND v_row.plan_id <> 'trial' THEN
      RAISE EXCEPTION 'PLAN_ALREADY_ACTIVE';
    END IF;
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;

  RETURN v_row;
END;
$function$;

-- Lets the pricing pages hide the trial offer for a return visitor instead
-- of showing it and then failing on click. Callable by the signed-in user
-- for their own account only (mirrors the auth.uid() check in every other
-- security definer RPC here).
create or replace function public.has_used_trial_email(p_owner_id uuid)
returns boolean
language plpgsql
security definer
stable
as $function$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() <> p_owner_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO v_email FROM profiles WHERE id = p_owner_id;
  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM used_trial_emails WHERE email_lower = lower(v_email));
END;
$function$;
