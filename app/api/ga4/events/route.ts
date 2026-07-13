import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report } from '@/lib/ga4/report'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const events = searchParams.get('events')?.split(',').filter(Boolean) ?? []
  const periodDays = parseInt(searchParams.get('periodDays') ?? '7')

  if (!projectId || events.length === 0)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('ga4_property_id, owner_id')
    .eq('id', projectId)
    .single()

  if (!project || project.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const propertyId = project.ga4_property_id
  const token = await getGa4Token()
  if (!token)
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const endC = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - (periodDays - 1))
  const endP = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - (periodDays - 1))

  // GA4's date dimension, e.g. "20260706" — matches what the Data API
  // actually returns in dimensionValues (no dashes), unlike the "YYYY-MM-DD"
  // dateRanges request format from fmt() above.
  function dateRangeYYYYMMDD(start: Date, end: Date): string[] {
    const dates: string[] = []
    const d = new Date(start)
    while (d <= end) {
      dates.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`)
      d.setDate(d.getDate() + 1)
    }
    return dates
  }
  const currentDates = dateRangeYYYYMMDD(startC, endC)
  const prevDates = dateRangeYYYYMMDD(startP, endP)

  try {
    const [rCurrent, rPrev] = await Promise.all([
      ga4Report(propertyId, token, {
        dateRanges: [{ startDate: fmt(startC), endDate: fmt(endC) }],
        dimensions: [{ name: 'eventName' }, { name: 'date' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: events } } },
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      ga4Report(propertyId, token, {
        dateRanges: [{ startDate: fmt(startP), endDate: fmt(endP) }],
        dimensions: [{ name: 'eventName' }, { name: 'date' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: events } } },
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    ])

    const result: Record<string, any> = {}
    for (const ev of events) result[ev] = { current: [], prev: [], totalCurrent: 0, totalPrev: 0 }

    // GA4 omits an eventName×date row entirely when that day had zero
    // events, rather than returning it with count 0. Left as-is, a day
    // missing from `current` but not `prev` (or vice versa) would silently
    // shift every day-to-day pairing after it once the mini bar chart lines
    // the two arrays up by index — comparing the wrong days against each
    // other. Collecting into a per-event map first and then reading through
    // the full, gapless date list guarantees every index lines up with the
    // same calendar day (offset by exactly one period) in both arrays.
    const currentByEvent: Record<string, Map<string, number>> = {}
    const prevByEvent: Record<string, Map<string, number>> = {}
    for (const ev of events) { currentByEvent[ev] = new Map(); prevByEvent[ev] = new Map() }

    for (const row of rCurrent.rows ?? []) {
      const evName = row.dimensionValues[0].value
      const date = row.dimensionValues[1].value
      const count = parseInt(row.metricValues[0].value ?? '0')
      if (result[evName]) { currentByEvent[evName].set(date, count); result[evName].totalCurrent += count }
    }
    for (const row of rPrev.rows ?? []) {
      const evName = row.dimensionValues[0].value
      const date = row.dimensionValues[1].value
      const count = parseInt(row.metricValues[0].value ?? '0')
      if (result[evName]) { prevByEvent[evName].set(date, count); result[evName].totalPrev += count }
    }

    for (const ev of events) {
      result[ev].current = currentDates.map(date => ({ date, count: currentByEvent[ev].get(date) ?? 0 }))
      result[ev].prev = prevDates.map(date => ({ date, count: prevByEvent[ev].get(date) ?? 0 }))
    }

    return NextResponse.json({ events: result, ranges: { current: { start: fmt(startC), end: fmt(endC) }, prev: { start: fmt(startP), end: fmt(endP) } } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
