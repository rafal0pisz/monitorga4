-- ============================================================
-- GA4 Quality Score — Migration 003: GA4 OAuth tokens
-- Dodaje kolumny tokenów Google do tabeli profiles
-- ============================================================

alter table profiles
  add column if not exists ga4_access_token  text,
  add column if not exists ga4_refresh_token text,
  add column if not exists ga4_token_expiry  timestamptz;

-- Google OAuth Client credentials (potrzebne do refresh tokena)
-- Przechowujemy tu żeby worker mógł odświeżyć token bez kontekstu użytkownika
-- UWAGA: wypełnij ręcznie przez SQL Editor lub przez .env w workerze
-- insert into app_config values ('google_client_id', '...'), ('google_client_secret', '...');

create table if not exists app_config (
  key   text primary key,
  value text not null
);

-- RLS: tylko service_role może czytać (worker używa admin client)
alter table app_config enable row level security;
-- Brak polityk dla zwykłych użytkowników = tylko service_role ma dostęp
