// Groups are stored as "GROUP - <name>" (src/lib/team/access.ts comment,
// enforced in app/api/team/groups/route.ts) so they're never ambiguous
// with a plain project name in a raw list — but showing that literal
// prefix everywhere it's displayed (sidebar headers, project settings,
// Team/Groups management UI) reads as a DB-internal artifact, not a
// label. This normalizes it to "Group <name>" everywhere a group's name
// is shown to a person, so the prefix is consistent, lowercase-dash-free,
// and still unambiguous.
export function formatGroupName(raw: string): string {
  return raw.replace(/^group\s*-\s*/i, 'Group ')
}
