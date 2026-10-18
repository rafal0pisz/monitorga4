import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { GA4_STANDARD_EVENTS } from '@/lib/ga4/standardEvents'
import { ga4Report } from '@/lib/ga4/report'
import { resolvePropertyId } from '@/lib/ga4/resolveProperty'

// Lists the events actually firing on a property, ordered by volume — powers
// the "suggest events instead of blind text entry" flows in the creation
// wizard and the project settings edit panel.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resolved = await resolvePropertyId(searchParams)
  if ('error' in resolved) return resolved.error
  const { propertyId } = resolved
  const periodDays = parseInt(searchParams.get('periodDays') ?? '30')

  const token = await getGa4Token()
  if (!token)
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const end = new Date(today); end.setDate(today.getDate() - 1)
  const start = new Date(end); start.setDate(end.getDate() - (periodDays - 1))

  try {
    const data = await ga4Report(propertyId, token, {
      dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 60,
    })

    const events = (data.rows ?? []).map((row: any) => {
      const name = row.dimensionValues[0].value as string
      const count = parseInt(row.metricValues[0].value ?? '0')
      return { name, count, isStandard: GA4_STANDARD_EVENTS.has(name) }
    })

    return NextResponse.json({ events, range: { start: fmt(start), end: fmt(end) } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
