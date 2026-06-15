-- ============================================================
-- GA4 Quality Score — Migration 005: Sections architecture
-- Nowe tabele: custom_event_checks, ecommerce_config, parameter_checks
-- Nowe kolumny: projects.sections, projects.sections_config
-- ============================================================

-- ── Sekcje włączone per projekt ─────────────────────────────
alter table projects
  add column if not exists sections jsonb not null default '{
    "traffic":       true,
    "engagement":    true,
    "users":         true,
    "custom_events": false,
    "ecommerce":     false,
    "parameters":    false
  }'::jsonb;

-- ── Custom events do monitorowania ──────────────────────────
create table if not exists custom_event_checks (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  event_name          text not null,
  check_type          text not null default 'presence',
  -- 'presence' = czy event istnieje w GA4
  -- 'volume'   = czy liczba eventów nie spada WoW
  -- 'anomaly'  = czy liczba eventów nie skacze anomalnie WoW
  min_expected_count  int4,           -- opcjonalny próg minimalny (dla 'volume')
  is_enabled          boolean not null default true,
  sort_order          int2 not null default 0,
  created_at          timestamptz not null default now(),
  unique (project_id, event_name)
);

-- ── Konfiguracja modułu ecommerce ───────────────────────────
create table if not exists ecommerce_config (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  event_name      text not null,
  -- Eventy: 'purchase', 'add_to_cart', 'begin_checkout', 'view_item', 'remove_from_cart'
  is_enabled      boolean not null default true,
  check_revenue   boolean not null default true,   -- weryfikuj revenue WoW
  check_quantity  boolean not null default true,   -- weryfikuj ilość WoW
  check_funnel    boolean not null default false,  -- uwzględnij w analizie funnela
  created_at      timestamptz not null default now(),
  unique (project_id, event_name)
);

-- ── Weryfikacja parametrów per event ────────────────────────
create table if not exists parameter_checks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  event_name      text not null,        -- event do którego należy parametr
  parameter_name  text not null,        -- np. "transaction_id", "item_name"
  check_type      text not null default 'not_null',
  -- 'not_null'  = parametr musi być obecny i niepusty
  -- 'not_empty' = parametr nie może być pustym stringiem
  -- 'regex'     = wartość musi pasować do wzorca
  -- 'in_list'   = wartość musi być z listy dopuszczalnych
  expected_value  text,                 -- wzorzec regex lub lista CSV dla in_list
  is_required     boolean not null default true,  -- true=fail, false=warn przy problemie
  sort_order      int2 not null default 0,
  created_at      timestamptz not null default now(),
  unique (project_id, event_name, parameter_name)
);

-- ── RLS (tymczasowo otwarte jak reszta tabel w MVP) ──────────
alter table custom_event_checks  enable row level security;
alter table ecommerce_config     enable row level security;
alter table parameter_checks     enable row level security;

create policy "custom_event_checks_all" on custom_event_checks
  for all using (true) with check (true);

create policy "ecommerce_config_all" on ecommerce_config
  for all using (true) with check (true);

create policy "parameter_checks_all" on parameter_checks
  for all using (true) with check (true);

-- ── Indeksy ─────────────────────────────────────────────────
create index if not exists custom_event_checks_project_idx
  on custom_event_checks (project_id);

create index if not exists ecommerce_config_project_idx
  on ecommerce_config (project_id);

create index if not exists parameter_checks_project_idx
  on parameter_checks (project_id, event_name);

-- ── Predefiniowane eventy ecommerce (katalog) ───────────────
-- Używane przez UI żeby pokazać listę do wyboru
create table if not exists ecommerce_events_catalog (
  event_name    text primary key,
  label         text not null,
  description   text,
  is_standard   boolean not null default true,  -- standardowy event GA4 ecommerce
  sort_order    int2 not null default 0
);

insert into ecommerce_events_catalog (event_name, label, description, sort_order) values
  ('purchase',         'Purchase',         'Zakup — kluczowy event konwersji',        1),
  ('begin_checkout',   'Begin checkout',   'Rozpoczęcie procesu zakupu',              2),
  ('add_to_cart',      'Add to cart',      'Dodanie produktu do koszyka',             3),
  ('remove_from_cart', 'Remove from cart', 'Usunięcie produktu z koszyka',            4),
  ('view_cart',        'View cart',        'Wyświetlenie koszyka',                    5),
  ('view_item',        'View item',        'Wyświetlenie strony produktu',            6),
  ('view_item_list',   'View item list',   'Wyświetlenie listy produktów',            7),
  ('select_item',      'Select item',      'Kliknięcie w produkt na liście',          8),
  ('add_to_wishlist',  'Add to wishlist',  'Dodanie do listy życzeń',                 9),
  ('add_payment_info', 'Add payment info', 'Podanie danych płatności',               10),
  ('add_shipping_info','Add shipping info','Podanie adresu dostawy',                 11),
  ('select_promotion', 'Select promotion', 'Kliknięcie w promocję',                  12),
  ('view_promotion',   'View promotion',   'Wyświetlenie promocji',                   13),
  ('refund',           'Refund',           'Zwrot zakupu',                            14)
on conflict (event_name) do nothing;

-- ── Predefiniowane parametry ecommerce (katalog) ────────────
-- Używane przez UI przy sekcji Parameters
create table if not exists parameter_catalog (
  id              uuid primary key default gen_random_uuid(),
  event_name      text not null,
  parameter_name  text not null,
  label           text not null,
  check_type_default text not null default 'not_null',
  is_required_default boolean not null default true,
  unique (event_name, parameter_name)
);

insert into parameter_catalog (event_name, parameter_name, label, check_type_default, is_required_default) values
  ('purchase', 'transaction_id', 'Transaction ID',    'not_null', true),
  ('purchase', 'value',          'Value (revenue)',   'not_null', true),
  ('purchase', 'currency',       'Currency',          'not_null', true),
  ('purchase', 'items',          'Items array',       'not_null', true),
  ('purchase', 'coupon',         'Coupon code',       'not_empty', false),
  ('add_to_cart', 'item_id',     'Item ID',           'not_null', true),
  ('add_to_cart', 'item_name',   'Item name',         'not_null', true),
  ('add_to_cart', 'currency',    'Currency',          'not_null', false),
  ('add_to_cart', 'value',       'Value',             'not_null', false),
  ('view_item', 'item_id',       'Item ID',           'not_null', true),
  ('view_item', 'item_name',     'Item name',         'not_null', true),
  ('begin_checkout', 'value',    'Cart value',        'not_null', false),
  ('begin_checkout', 'currency', 'Currency',          'not_null', false)
on conflict (event_name, parameter_name) do nothing;
