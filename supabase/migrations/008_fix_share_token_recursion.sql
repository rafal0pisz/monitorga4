-- ============================================================
-- GA4 Quality Score — Migration 008: fix recursive/leaky share policy
-- ============================================================
-- Migracja 007 kasowała stare policy na `projects` po nazwach
-- projects_select/insert/update/delete, ale nie wiedziała o piątej,
-- osobnej policy "projects_share_token" (SELECT), która przetrwała
-- i powodowała dwa problemy naraz:
--
-- 1. Bezpieczeństwo: klauzula "OR org_id = my_org_id()" pozwalała
--    każdemu userowi z tej samej organizacji widzieć WSZYSTKIE projekty,
--    z pominięciem owner_id — dokładnie to, co migracja 007 miała zamknąć.
--
-- 2. "stack depth limit exceeded": my_org_id() odpytuje `profiles`,
--    a `profiles` ma własną politykę RLS, która też woła my_org_id() —
--    stąd nieskończona rekurencja przy każdym SELECT na `projects`
--    (w tym niejawnym SELECT po UPDATE, którego używa PostgREST/
--    supabase-js do zwrócenia zapisanego wiersza).
--
-- /share/[token] czyta przez createAdminClient() (service role, który
-- i tak omija RLS), więc ta policy nie jest w ogóle wymagana do
-- działania publicznych linków share — zostawiamy tylko dopasowanie
-- po share_token na wypadek przyszłego użycia z sesją przeglądarki,
-- ale bez wywołania my_org_id().

drop policy if exists "projects_share_token" on projects;

create policy "projects_share_token" on projects
  for select using (
    share_token = ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'share_token'::text)
  );
