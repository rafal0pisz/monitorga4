import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report } from '@/lib/ga4/report'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const events = searchParams.get('events')?.split(',').filter(Boolean) ?? []
  const periodDays = parseInt(searchParams.get('periodDays') ?? '7')

  if (!propertyId || events.length === 0)
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const token = await getGa4Token()
  if (!token)
    return NextResponse.json({ error: 'No GA4 token — please sign in with Google' }, { status: 401 })

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const endC = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - (periodDays - 1))
  const endP = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - (periodDays - 1))

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

    for (const row of rCurrent.rows ?? []) {
      const evName = row.dimensionValues[0].value
      const date = row.dimensionValues[1].value
      const count = parseInt(row.metricValues[0].value ?? '0')
      if (result[evName]) { result[evName].current.push({ date, count }); result[evName].totalCurrent += count }
    }
    for (const row of rPrev.rows ?? []) {
      const evName = row.dimensionValues[0].value
      const date = row.dimensionValues[1].value
      const count = parseInt(row.metricValues[0].value ?? '0')
      if (result[evName]) { result[evName].prev.push({ date, count }); result[evName].totalPrev += count }
    }

    return NextResponse.json({ events: result, ranges: { current: { start: fmt(startC), end: fmt(endC) }, prev: { start: fmt(startP), end: fmt(endP) } } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
