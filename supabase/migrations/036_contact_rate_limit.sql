-- ============================================================
-- GA4 Quality Score — Migration 036: contact form rate limiting
-- ============================================================
-- /api/contact is fully public and unauthenticated (anyone can POST, no
-- session). It already has a honeypot field, but nothing throttled repeat
-- submissions from the same IP — a script could spam kontakt@bettersteps.pl
-- or burn through Resend's send volume/reputation. One row per submission,
-- counted per IP over a rolling window — see app/api/contact/route.ts.

create table if not exists contact_submissions (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_submissions_ip_created on contact_submissions(ip, created_at);

alter table contact_submissions enable row level security;
-- No policies = no access via anon/authenticated keys. Only
-- app/api/contact/route.ts via createAdminClient (service_role) reads or
-- writes this table — it's never read from the browser.
