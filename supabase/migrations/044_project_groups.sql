-- ============================================================
-- GA4 Quality Score — Migration 044: project groups (client grouping)
-- ============================================================
-- Per-project grants (migration 043) solved the "team members see every
-- client's project name" leak, but created a new chore: an agency with,
-- say, 5 projects for one client has to remember to grant every team
-- member access to each NEW project for that client individually. Groups
-- fix that — grant a group once, and every project placed in it (now or
-- later) is covered automatically.
--
-- A project belongs to AT MOST one group (projects.group_id, nullable —
-- most accounts will have some ungrouped projects, and that's fine).
-- Group access and direct per-project access (migration 043) are additive:
-- a project is accessible if the viewer is the owner, OR has a direct
-- grant on it, OR has a grant on the group it belongs to. Nothing from
-- migration 043 is removed or migrated automatically — the product owner
-- confirmed only one project currently has any grants at all, and will
-- move that one into a group by hand rather than this migration guessing
-- at a backfill.

create table if not exists project_groups (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (owner_id, name)
);

create index if not exists project_groups_owner_idx on project_groups (owner_id);

alter table projects add column if not exists group_id uuid references project_groups(id) on delete set null;
create index if not exists projects_group_idx on projects (group_id);

create table if not exists group_team_members (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references project_groups(id) on delete cascade,
  team_member_id  uuid not null references team_members(id) on delete cascade,
  granted_at      timestamptz not null default now(),
  unique (group_id, team_member_id)
);

create index if not exists group_team_members_group_idx  on group_team_members (group_id);
create index if not exists group_team_members_member_idx on group_team_members (team_member_id);

-- Locked down the same way as team_members/project_team_members: writes
-- only ever go through the admin client (service_role) from API routes,
-- which own the actual business logic (ownership checks, per-service seat
-- cap). Authenticated users can only ever SELECT rows that are actually
-- theirs to see — as the owner, or as a granted member.
alter table project_groups enable row level security;
alter table group_team_members enable row level security;

drop policy if exists "project_groups_select" on project_groups;
create policy "project_groups_select" on project_groups
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from group_team_members gtm
      join team_members tm on tm.id = gtm.team_member_id
      where gtm.group_id = project_groups.id and tm.member_id = auth.uid() and tm.accepted_at is not null
    )
  );

drop policy if exists "group_team_members_select" on group_team_members;
create policy "group_team_members_select" on group_team_members
  for select using (
    exists (select 1 from project_groups g where g.id = group_id and g.owner_id = auth.uid())
    or exists (select 1 from team_members tm where tm.id = team_member_id and tm.member_id = auth.uid())
  );

-- Every project id an authenticated user may access: their own, a project
-- directly granted to them (migration 043), or a project whose GROUP is
-- granted to them. Replaces the migration 043 version of this function.
create or replace function public.my_accessible_project_ids()
returns setof uuid
language sql
stable
as $function$
  select id from projects where owner_id = auth.uid()
  union
  select ptm.project_id
  from project_team_members ptm
  join team_members tm on tm.id = ptm.team_member_id
  where tm.member_id = auth.uid() and tm.accepted_at is not null
  union
  select p.id
  from projects p
  join group_team_members gtm on gtm.group_id = p.group_id
  join team_members tm on tm.id = gtm.team_member_id
  where tm.member_id = auth.uid() and tm.accepted_at is not null
$function$;
