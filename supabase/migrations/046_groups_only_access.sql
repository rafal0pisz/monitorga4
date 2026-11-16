-- ============================================================
-- GA4 Quality Score — Migration 046: groups are now the only sharing unit
-- ============================================================
-- Direct per-project grants (migration 043) made sense when projects could
-- be ungrouped. Since migration 045 guarantees every project belongs to a
-- group (falling back to "GROUP - Default"), a separate per-project grant
-- mechanism is now redundant complexity — managing access per group only
-- is simpler and matches how the UI now works (Team page grants GROUPS,
-- not individual services; a project's own Settings page no longer has
-- its own access toggle).
--
-- Before dropping project_team_members, every existing direct grant is
-- translated into an equivalent group grant on the project's own group,
-- so nobody who currently has access loses it — this is a data-shape
-- change, not an access change. Safe to re-run (ON CONFLICT DO NOTHING).

insert into group_team_members (group_id, team_member_id)
select p.group_id, ptm.team_member_id
from project_team_members ptm
join projects p on p.id = ptm.project_id
where p.group_id is not null
on conflict (group_id, team_member_id) do nothing;

-- Now safe to retire the per-project mechanism entirely.
drop function if exists public.get_project_team_access(uuid);
drop table if exists project_team_members;

-- my_accessible_project_ids() drops the project_team_members union branch
-- — access is resolved purely from ownership + group membership now.
create or replace function public.my_accessible_project_ids()
returns setof uuid
language sql
stable
as $function$
  select id from projects where owner_id = auth.uid()
  union
  select p.id
  from projects p
  join group_team_members gtm on gtm.group_id = p.group_id
  join team_members tm on tm.id = gtm.team_member_id
  where tm.member_id = auth.uid() and tm.accepted_at is not null
$function$;
