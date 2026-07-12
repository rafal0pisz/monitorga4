import { NextRequest, NextResponse } from 'next/server'
import { getGa4Token } from '@/lib/ga4/token'
import { ga4Report } from '@/lib/ga4/report'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GA4 dimension name for a custom event parameter
// Standard item dimensions use camelCase (itemName, transactionId)
// Custom event parameters use customEvent:param_name
const STANDARD_ITEM_DIMS: Record<string, string> = {
  item_name:        'itemName',
  item_id:          'itemId',
  item_brand:       'itemBrand',
  item_category:    'itemCategory',
  item_variant:     'itemVariant',
  transaction_id:   'transactionId',
  affiliation:      'transactionId', // fallback
  currency:         'currency',
}

function ga4DimName(parameterName: string): string {
  return STANDARD_ITEM_DIMS[parameterName] ?? `customEvent:${parameterName}`
}

interface CoverageResult {
  total_events: number
  events_with_value: number
  coverage: number             // 0–1
  top_values: { value: string; count: number }[]
}

async function getCoverage(propertyId: string, token: string, eventName: string, parameterName: string, startDate: string, endDate: string): Promise<CoverageResult> {
  const dimName = ga4DimName(parameterName)

  // Query: dimension = parameter value, filter = eventName, metric = eventCount
  const r = await ga4Report(propertyId, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: dimName }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: { fieldName: 'eventName', stringFilter: { value: eventName, matchType: 'EXACT' } }
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  })

  const rows = r.rows ?? []
  const total = rows.reduce((s: number, row: any) => s + parseInt(row.metricValues[0].value ?? '0'), 0)
  const notSetRows = rows.filter((row: any) => row.dimensionValues[0].value === '(not set)')
  const notSetCount = notSetRows.reduce((s: number, row: any) => s + parseInt(row.metricValues[0].value ?? '0'), 0)
  const withValue = total - notSetCount
  const coverage = total > 0 ? withValue / total : 0

  const topValues = rows
    .filter((row: any) => row.dimensionValues[0].value !== '(not set)')
    .slice(0, 5)
    .map((row: any) => ({
      value: row.dimensionValues[0].value,
      count: parseInt(row.metricValues[0].value ?? '0'),
    }))

  return { total_events: total, events_with_value: withValue, coverage, top_values: topValues }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId   = searchParams.get('projectId')
  const eventName   = searchParams.get('event')
  const paramName   = searchParams.get('parameter')
  const periodDays  = parseInt(searchParams.get('periodDays') ?? '7')

  if (!projectId || !eventName || !paramName)
    return NextResponse.json({ error: 'Missing params: projectId, event, parameter' }, { status: 400 })

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

  // Compute date ranges
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const endC  = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - (periodDays - 1))
  const endP  = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - (periodDays - 1))

  try {
    const [current, prev] = await Promise.all([
      getCoverage(propertyId, token, eventName, paramName, fmt(startC), fmt(endC)),
      getCoverage(propertyId, token, eventName, paramName, fmt(startP), fmt(endP)),
    ])

    const delta = prev.coverage > 0 ? ((current.coverage - prev.coverage) / prev.coverage) * 100 : null
    const absoluteDelta = current.coverage - prev.coverage

    return NextResponse.json({
      event_name:     eventName,
      parameter_name: paramName,
      ga4_dimension:  ga4DimName(paramName),
      current,
      prev,
      delta_relative: delta !== null ? +delta.toFixed(1) : null,
      delta_absolute: +( absoluteDelta * 100).toFixed(1), // in percentage points
      ranges: {
        current: { start: fmt(startC), end: fmt(endC) },
        prev:    { start: fmt(startP), end: fmt(endP) },
      }
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      ga4_dimension: ga4DimName(paramName),
      hint: err.message.includes('400') ? `Dimension '${ga4DimName(paramName)}' not found. Register '${paramName}' as a custom event dimension in GA4 Admin → Custom definitions.` : undefined,
    }, { status: 500 })
  }
}
