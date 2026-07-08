-- ============================================================
-- GA4 Quality Score — Migration 007: project ownership
-- ============================================================
-- Do tej pory RLS na `projects` było WYŁĄCZONE (rls_enabled = false) —
-- każdy zalogowany użytkownik widział wszystkie projekty w organizacji.
-- Ta migracja wprowadza własność projektu per konto Google i włącza RLS
-- z politykami opartymi o owner_id.

alter table projects
  add column if not exists owner_id uuid references auth.users(id);

-- Backfill: wszystkie istniejące projekty przypisujemy do konta, które
-- jest dziś oznaczone jako domyślne dla crona (is_ga4_default, migracja
-- 006) — to jedyne konto realnie używające tej apki przed wprowadzeniem
-- wielu użytkowników.
update projects
set owner_id = (select id from profiles where is_ga4_default = true limit 1)
where owner_id is null;

-- Widok dashboard_projects musi przekazywać owner_id dalej, żeby dashboard
-- i sidebar mogły filtrować po właścicielu (obie strony czytają przez
-- createAdminClient — service role, które i tak omija RLS na widokach/
-- tabelach źródłowych, więc filtrowanie w kodzie aplikacji jest tu
-- głównym mechanizmem izolacji dla tych dwóch miejsc).
create or replace view dashboard_projects as
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
    prev.score_total AS prev_week_score
   FROM projects p
     LEFT JOIN project_latest_run lr ON lr.project_id = p.id
     LEFT JOIN LATERAL ( SELECT dqs_runs.score_total
           FROM dqs_runs
          WHERE dqs_runs.project_id = p.id AND dqs_runs.status = 'completed'::run_status AND dqs_runs.run_date <= (lr.run_date - '7 days'::interval)
          ORDER BY dqs_runs.run_date DESC
         LIMIT 1) prev ON true;

-- Włącz RLS i podmień istniejące, zbyt szerokie polityki (migracja 004:
-- "using (true)") na realne, oparte o właściciela. Bez jawnego DROP te
-- stare polityki zostałyby aktywne OBOK nowych (RLS łączy polityki przez
-- OR), co unieważniłoby całą izolację.
alter table projects enable row level security;

drop policy if exists "projects_select" on projects;
drop policy if exists "projects_insert" on projects;
drop policy if exists "projects_update" on projects;
drop policy if exists "projects_delete" on projects;

create policy "projects_select" on projects
  for select using (owner_id = auth.uid());

create policy "projects_insert" on projects
  for insert with check (owner_id = auth.uid());

create policy "projects_update" on projects
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "projects_delete" on projects
  for delete using (owner_id = auth.uid());

-- Uwaga: createAdminClient() używa service_role, który zawsze omija RLS —
-- powyższe polityki chronią tylko wywołania z przeglądarki (klient
-- authenticated). Strony renderowane po stronie serwera (dashboard,
-- /project/[id], worker/cron) muszą same filtrować po owner_id w kodzie
-- aplikacji, co jest dodane w tym samym PR.

-- ============================================================
-- Ownership check w funkcjach RPC (SECURITY DEFINER)
-- ============================================================
-- Wszystkie poniższe funkcje są SECURITY DEFINER i przyjmują p_project_id
-- bez żadnej weryfikacji właściciela — RLS na `projects` ich NIE chroni
-- (SECURITY DEFINER działa z uprawnieniami właściciela funkcji, z
-- pominięciem RLS). Każdy zalogowany użytkownik mógł dotąd odczytać/
-- nadpisać konfigurację dowolnego projektu, znając samo jego UUID.
--
-- auth.role() = 'service_role' przepuszcza wywołania z workera/crona
-- (createAdminClient, bez sesji użytkownika) bez zmian w ich działaniu.

create or replace function public.get_custom_event_checks(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY sort_order), '[]'::jsonb)
  INTO result FROM custom_event_checks t WHERE project_id = p_project_id;
  RETURN result;
END;
$function$;

create or replace function public.get_ecommerce_config(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result FROM ecommerce_config t WHERE project_id = p_project_id AND is_enabled = true;
  RETURN result;
END;
$function$;

create or replace function public.get_parameter_checks(p_project_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY event_name, sort_order), '[]'::jsonb)
  INTO result FROM parameter_checks t WHERE project_id = p_project_id;
  RETURN result;
END;
$function$;

create or replace function public.save_custom_event_checks(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM custom_event_checks WHERE project_id = p_project_id;
  IF jsonb_array_length(p_events) > 0 THEN
    INSERT INTO custom_event_checks (project_id, event_name, check_type, is_enabled, sort_order)
    SELECT p_project_id, e->>'event_name', e->>'check_type',
           (e->>'is_enabled')::boolean, (e->>'sort_order')::int
    FROM jsonb_array_elements(p_events) e;
  END IF;
END;
$function$;

create or replace function public.save_ecommerce_config(p_project_id uuid, p_events jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM ecommerce_config WHERE project_id = p_project_id;
  IF jsonb_array_length(p_events) > 0 THEN
    INSERT INTO ecommerce_config (project_id, event_name, is_enabled, check_revenue, check_quantity, check_funnel)
    SELECT p_project_id, e->>'event_name', true, true, true, false
    FROM jsonb_array_elements(p_events) e;
  END IF;
END;
$function$;

create or replace function public.save_parameter_checks(p_project_id uuid, p_params jsonb)
returns void
language plpgsql
security definer
as $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for project %', p_project_id;
  END IF;
  DELETE FROM parameter_checks WHERE project_id = p_project_id;
  IF jsonb_array_length(p_params) > 0 THEN
    INSERT INTO parameter_checks (project_id, event_name, parameter_name, check_type, is_required, sort_order)
    SELECT p_project_id, p->>'event_name', p->>'parameter_name',
           'not_null', true, (p->>'sort_order')::int
    FROM jsonb_array_elements(p_params) p;
  END IF;
END;
$function$;
