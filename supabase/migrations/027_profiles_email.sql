-- ============================================================
-- GA4 Quality Score — Migration 027: profiles.email
-- ============================================================
-- Lets app/api/team/invite look up "does this email already have an
-- AlertGA4 account" BEFORE sending an invite, instead of only finding out
-- when the invited person tries to accept (app/api/team/accept already
-- blocks that case, but by then the owner has already sent — and the
-- invitee has already received — an invite that can never be accepted).
--
-- Backfilled here from auth.users for every existing account so today's
-- users are covered immediately; app/auth/callback/route.ts keeps it in
-- sync on every future login.

alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create index if not exists profiles_email_lower_idx on profiles (lower(email));
