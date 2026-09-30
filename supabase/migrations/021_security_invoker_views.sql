-- Fixes Supabase's "Security Definer View" advisory (security_definer_view)
-- on project_latest_run and dashboard_projects: a plain Postgres view runs
-- its underlying query with the view OWNER's privileges by default (like an
-- implicit SECURITY DEFINER), bypassing the querying user's own RLS instead
-- of enforcing it. security_invoker flips that to the querying user's
-- privileges instead — the Postgres 15+ reloption for exactly this, no need
-- to redefine either view's body.
--
-- Safe for how the app actually uses these: both are only ever queried via
-- createAdminClient() (service role) in app/dashboard/page.tsx and
-- AppSidebar.tsx — the service role bypasses RLS regardless of this
-- setting, so this only closes the gap for any other (anon/authenticated)
-- caller, without changing what the app itself sees.

alter view public.project_latest_run set (security_invoker = on);
alter view public.dashboard_projects  set (security_invoker = on);
