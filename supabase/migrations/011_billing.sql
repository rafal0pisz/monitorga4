-- ============================================================
-- GA4 Quality Score — Migration 011: billing (Stripe subscriptions)
-- ============================================================
-- Wprowadza płatne plany (Individual/Pro/Agency) z limitem liczby
-- projektów per konto. Tenancy w tej apce to owner_id (jeden użytkownik
-- Supabase = jeden klient) — org_id jest martwym, wspólnym dla
-- wszystkich placeholderem (patrz komentarze w migracjach 007-010) i
-- pozostaje bez zmian, poza zakresem tej migracji.

alter table profiles add column if not exists plan_id text;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists subscription_status text;
alter table profiles add column if not exists billing_cycle text;
alter table profiles add column if not exists current_period_end timestamptz;

-- Backfill: każdy profil istniejący dziś to wewnętrzne użycie Bettersteps —
-- płacący klienci zewnętrzni jeszcze nie istnieją. Nowe rejestracje od tego
-- momentu poprawnie lądują z plan_id = null (brak planu = 0 projektów,
-- dopóki nie wykupią subskrypcji).
update profiles set plan_id = 'internal' where plan_id is null;

-- ============================================================
-- Log zdarzeń webhooków Stripe — audyt + idempotencja (Stripe potrafi
-- wysłać ten sam event wielokrotnie przy retry).
-- ============================================================
create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  profile_id uuid references profiles(id),
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table billing_events enable row level security;
-- Brak polityk = brak dostępu przez klucz anon/authenticated. Zapisuje i
-- czyta wyłącznie webhook Stripe przez createAdminClient (service_role),
-- które i tak omija RLS — ta tabela nie jest nigdy czytana z przeglądarki.

-- ============================================================
-- Limit projektów per plan
-- ============================================================
create or replace function public.plan_project_limit(p_plan_id text)
returns int
language sql
immutable
as $function$
  select case p_plan_id
    when 'individual' then 3
    when 'pro' then 10
    when 'agency' then 100
    when 'internal' then 1000000
    else 0  -- brak planu = nie można jeszcze tworzyć projektów
  end
$function$;

-- ============================================================
-- Tworzenie projektu z egzekwowaniem limitu planu (SECURITY DEFINER —
-- limit musi być sprawdzany po stronie serwera, nie tylko w UI, inaczej
-- klient mógłby ominąć go wywołując insert bezpośrednio).
-- ============================================================
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
  IF auth.uid() <> p_owner_id THEN
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
