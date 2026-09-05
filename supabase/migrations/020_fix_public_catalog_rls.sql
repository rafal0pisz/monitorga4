-- Fixes Supabase's "Table publicly accessible" security advisory
-- (rls_disabled_in_public): ecommerce_events_catalog and parameter_catalog
-- were created in 005_sections.sql without ever enabling Row-Level
-- Security, unlike every other table in that same migration. Both are
-- read-only reference/catalog data (predefined GA4 ecommerce events and
-- parameters, shown as suggestions in the UI) — not user data, and in
-- fact not queried by the app at runtime at all anymore (the app uses a
-- hardcoded TS list instead, see src/lib/ga4/ecommerceCatalog.ts and
-- parameterCatalog.ts) — but with RLS off, anyone with the project's
-- anon key could also insert/update/delete rows in them via the API, not
-- just read them.

alter table ecommerce_events_catalog enable row level security;
alter table parameter_catalog enable row level security;

drop policy if exists "ecommerce_events_catalog_select" on ecommerce_events_catalog;
create policy "ecommerce_events_catalog_select" on ecommerce_events_catalog
  for select using (true);

drop policy if exists "parameter_catalog_select" on parameter_catalog;
create policy "parameter_catalog_select" on parameter_catalog
  for select using (true);

-- No insert/update/delete policy on either — this is static reference
-- data maintained via migrations only, same lockdown pattern as the other
-- tables already fixed in 010_lock_down_remaining_tables.sql.
