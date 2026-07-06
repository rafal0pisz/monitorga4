-- ============================================================
-- GA4 Quality Score — Migration 006: jawne konto domyślne dla crona
-- ============================================================
-- Worker (unattended cron, brak sesji użytkownika) wcześniej wybierał
-- token GA4 z tabeli profiles wg "najstarszy wpis" (order by created_at).
-- To przypadkowe — jeśli najstarsze konto nie ma dostępu do wszystkich
-- monitorowanych property GA4, cron dostaje 403 na każdym checku mimo
-- że inne, poprawnie uprawnione konto istnieje w tej samej organizacji.
--
-- is_ga4_default pozwala jawnie wskazać, które konto ma być używane
-- jako fallback dla automatycznych (cron) przebiegów.

alter table profiles
  add column if not exists is_ga4_default boolean not null default false;
