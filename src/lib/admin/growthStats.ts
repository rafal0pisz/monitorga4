import { createAdminClient } from '@/lib/supabase/server'
import type { GrowthPoint } from '@/components/admin/AdminGrowthChart'

// auth.admin.listUsers() is paginated — loop until a page comes back
// shorter than requested, rather than assuming everyone fits on page 1.
export async function fetchAllUserCreatedDates(admin: ReturnType<typeof createAdminClient>): Promise<Date[]> {
  const dates: Date[] = []
  const perPage = 1000
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    for (const user of data.users) dates.push(new Date(user.created_at))
    if (data.users.length < perPage) break
    page++
  }
  return dates
}

function dayKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function weekKey(d: Date): string {
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayOfWeek = (monday.getUTCDay() + 6) % 7 // 0 = Monday
  monday.setUTCDate(monday.getUTCDate() - dayOfWeek)
  return dayKey(monday)
}

// Builds a cumulative growth series (users + projects) over a shared set of
// date buckets — daily if the observed range is short, weekly once it gets
// long enough that daily points would just be noise.
export function buildGrowthSeries(userDates: Date[], projectDates: Date[]): GrowthPoint[] {
  const allDates = [...userDates, ...projectDates]
  if (allDates.length === 0) return []

  const earliest = new Date(Math.min(...allDates.map(d => d.getTime())))
  const today = new Date()
  const rangeDays = Math.max(1, Math.ceil((today.getTime() - earliest.getTime()) / (24 * 60 * 60 * 1000)))
  const useWeekly = rangeDays > 60
  const bucketFn = useWeekly ? weekKey : dayKey

  const bucketKeys: string[] = []
  const cursor = new Date(earliest)
  while (cursor <= today) {
    bucketKeys.push(bucketFn(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + (useWeekly ? 7 : 1))
  }
  // Dedup while preserving order (weekly stepping can repeat a key if the
  // start-of-range isn't a Monday).
  const orderedBuckets = [...new Set(bucketKeys)]

  const userCounts = new Map<string, number>()
  for (const d of userDates) userCounts.set(bucketFn(d), (userCounts.get(bucketFn(d)) ?? 0) + 1)
  const projectCounts = new Map<string, number>()
  for (const d of projectDates) projectCounts.set(bucketFn(d), (projectCounts.get(bucketFn(d)) ?? 0) + 1)

  let runningUsers = 0
  let runningProjects = 0
  return orderedBuckets.map(bucket => {
    runningUsers += userCounts.get(bucket) ?? 0
    runningProjects += projectCounts.get(bucket) ?? 0
    return { bucket, users: runningUsers, projects: runningProjects }
  })
}
