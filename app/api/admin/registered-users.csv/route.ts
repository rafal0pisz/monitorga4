import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin/isAdminEmail'
import { fetchRegisteredUsersData } from '@/lib/admin/registeredUsers'

// Escapes a value for a CSV field — only quotes when it actually contains
// something that would break the format (comma, quote, or newline), to
// keep the output readable for the common case of a plain email/date.
function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

// Same data as the admin dashboard's "Registered users" table — reads
// through fetchRegisteredUsersData() so the two can never show different
// numbers for the same account. Unlike the dashboard page (capped at
// MAX_USERS_SHOWN), this exports every registered user.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { rows } = await fetchRegisteredUsersData(admin)

  const header = ['Email', 'Registered', 'Plan', 'Type', 'Started', 'Valid until', 'Canceling', 'Active projects', 'Blocked projects']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      csvField(r.email ?? ''),
      r.createdAt,
      csvField(r.license.plan),
      csvField(r.license.type),
      r.license.startedAt ?? '',
      r.license.untilAt ?? '',
      r.license.canceling ? 'yes' : 'no',
      String(r.activeProjects),
      String(r.blockedProjects),
    ].join(','))
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alertga4-registered-users-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
