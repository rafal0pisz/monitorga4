'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'
import { type ParameterData, MiniParameterCard, ParameterCard } from './ParameterCardShared'
import { isGa4ReconnectError } from '@/lib/ga4/errors'
import { useTrackedError } from '@/lib/analytics/useTrackedError'

export type { ParameterData }

interface Props {
  projectId: string
  parameterChecks: { event_name: string; parameter_name: string }[]
  periodDays: number
  anchorOffset?: number
  // Set for projects with enough declared parameter checks that one live
  // GA4 request per card risks the per-property concurrent-requests quota
  // (see src/lib/ga4/report.ts and app/project/[id]/page.tsx for the
  // threshold). Reads the worker's own daily results instead of querying
  // GA4 live — a fixed day-over-day snapshot, not Period-reactive, and
  // without a top-values breakdown.
  cached?: boolean
}

type CachedResult =
  | { event_name: string; parameter_name: string; coverage_current: number; coverage_prev: number; delta: number; status: string }
  | { event_name: string; parameter_name: string; error: string }

export default function ParameterCoveragePanel(props: Props) {
  return props.cached ? <CachedParameterCoveragePanel {...props} /> : <LiveParameterCoveragePanel {...props} />
}

function CachedParameterCoveragePanel({ projectId, parameterChecks }: Props) {
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [runDate, setRunDate] = useState<string | null>(null)
  const [results, setResults] = useState<CachedResult[]>([])
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [blockedScope, setBlockedScope] = useState<'owner' | 'member'>('owner')
  const [reconnectMessage, setReconnectMessage] = useState<string | null>(null)
  const [error, setError] = useTrackedError('project_parameters_cached_panel')

  useEffect(() => {
    setLoading(true); setError(null); setBlockedMessage(null); setReconnectMessage(null)
    ga4Fetch(`/api/ga4/parameters-cached?projectId=${projectId}`)
      .then(async res => {
        const json = await res.json()
        if (res.status === 402 && json.error) { setBlockedMessage(json.error); setBlockedScope(json.scope === 'member' ? 'member' : 'owner'); return }
        if (res.status === 401 && json.error) { setReconnectMessage(json.error); return }
        if (!res.ok) throw new Error(json.error ?? 'Could not load parameter coverage')
        if (json.pending) { setPending(true); return }
        setRunDate(json.runDate)
        setResults(json.results ?? [])
      })
      .catch(err => {
        if (isGa4ReconnectError(err.message)) { setReconnectMessage(err.message); return }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  if (parameterChecks.length === 0) return null

  if (blockedMessage) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{blockedScope === 'member' ? "Owner's plan has ended" : 'Trial ended'}</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>{blockedMessage}</div>
        </div>
        {blockedScope === 'member'
          ? <a href="/dashboard/team" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Go to Team →</a>
          : <a href="/cennik" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</a>}
      </div>
    )
  }

  if (reconnectMessage) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#1e3a8a' }}>{reconnectMessage}</span>
        <a href="/login" style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Reconnect with Google →</a>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#f3f6f7', border: '1px solid var(--color-border-tertiary)', marginBottom: 10, fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
        {parameterChecks.length} parameters configured — too many to check live without risking GA4's request quota, so this section shows the automated daily worker's results instead.
        {!loading && !pending && runDate && <> Last computed: <strong style={{ color: 'var(--color-text-primary)' }}>{runDate}</strong> (yesterday vs. same day last week) — not affected by the Period selector above.</>}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Loading daily results…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <p style={{ fontSize: 12, color: '#ca8a04', margin: 0 }}>Could not load parameter coverage: {error}</p>
      ) : pending ? (
        <div style={{ padding: 14, borderRadius: 8, textAlign: 'center', backgroundColor: 'var(--color-background-primary)', border: '1px dashed var(--color-border-tertiary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          No daily results yet. The automated worker runs every ~30 minutes between 04:00–07:30 UTC — results will appear here after the next run (click <strong>Run now</strong> above to run it immediately).
        </div>
      ) : (
        <div className="page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 10 }}>
          {results.map(r => 'error' in r ? (
            <div key={`${r.event_name}_${r.parameter_name}`} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{r.event_name}.{r.parameter_name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.error}</div>
            </div>
          ) : (
            <MiniParameterCard
              key={`${r.event_name}_${r.parameter_name}`}
              data={{
                event_name: r.event_name,
                parameter_name: r.parameter_name,
                ga4_dimension: '',
                current: { total_events: 0, events_with_value: 0, coverage: r.coverage_current / 100, top_values: [] },
                prev: { total_events: 0, events_with_value: 0, coverage: r.coverage_prev / 100, top_values: [] },
                delta_relative: null,
                delta_absolute: r.delta,
                ranges: { current: { start: '', end: '' }, prev: { start: '', end: '' } },
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LiveParameterCoveragePanel({ projectId, parameterChecks, periodDays, anchorOffset = 0 }: Props) {
  // This is now the only Period-reactive parameter view (the stored daily
  // card was dropped — see the project page), so it fetches eagerly rather
  // than waiting on a click. Shown as compact MiniParameterCards by
  // default; "Show parameter details" reveals the fuller ParameterCard
  // (coverage bar, date ranges, top values) using this same fetched data.
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<Record<string, ParameterData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, { message: string; dimension?: string; hint?: string }>>({})
  // A lapsed trial applies to the whole project, not one parameter — one
  // combined banner instead of the same "trial ended" message repeated on
  // every single parameter card.
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [blockedScope, setBlockedScope] = useState<'owner' | 'member'>('owner')
  // Same reasoning as blockedMessage above — an insufficient-scope/expired
  // token applies to the whole project's Google connection, not one
  // parameter, so it gets one combined banner instead of the identical
  // "reconnect" error repeated on every single parameter row.
  const [reconnectMessage, setReconnectMessage] = useState<string | null>(null)

  useEffect(() => {
    setBlockedMessage(null)
    setReconnectMessage(null)
    for (const pc of parameterChecks) {
      const key = `${pc.event_name}_${pc.parameter_name}`
      setLoading(prev => ({ ...prev, [key]: true }))

      const params = new URLSearchParams({
        projectId,
        event: pc.event_name,
        parameter: pc.parameter_name,
        periodDays: String(periodDays),
        anchorOffset: String(anchorOffset),
      })

      ga4Fetch(`/api/ga4/parameters?${params}`)
        .then(async res => {
          const json = await res.json()
          if (res.status === 402 && json.error) { setBlockedMessage(json.error); setBlockedScope(json.scope === 'member' ? 'member' : 'owner'); return }
          if (res.status === 401 && json.error) { setReconnectMessage(json.error); return }
          return json
        })
        .then(json => {
          if (!json) return
          if (json.error) {
            // Carry the server's own ga4_dimension/hint through instead of
            // re-deriving "is this actually an unregistered custom
            // dimension" from a client-side string match on the error text
            // — a standard field that's simply unsupported for this event
            // (e.g. item_id on remove_from_cart) isn't a registration
            // problem and shouldn't get the "add it in GA4 Admin" hint.
            setErrors(prev => ({ ...prev, [key]: { message: json.error, dimension: json.ga4_dimension, hint: json.hint } }))
            return
          }
          setData(prev => ({ ...prev, [key]: json }))
        })
        .catch(err => {
          if (isGa4ReconnectError(err.message)) { setReconnectMessage(err.message); return }
          setErrors(prev => ({ ...prev, [key]: { message: err.message } }))
        })
        .finally(() => setLoading(prev => ({ ...prev, [key]: false })))
    }
  }, [projectId, JSON.stringify(parameterChecks), periodDays, anchorOffset])

  if (parameterChecks.length === 0) return null

  if (blockedMessage) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{blockedScope === 'member' ? "Owner's plan has ended" : 'Trial ended'}</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>{blockedMessage}</div>
        </div>
        {blockedScope === 'member'
          ? <a href="/dashboard/team" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Go to Team →</a>
          : <a href="/cennik" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</a>}
      </div>
    )
  }

  if (reconnectMessage) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a' }}>Google connection lost</div>
          <div style={{ fontSize: 11, color: '#1e3a8a', marginTop: 2 }}>{reconnectMessage}</div>
        </div>
        <a href="/login" style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Reconnect with Google →</a>
      </div>
    )
  }

  return (
    <div>
      <div
        className={expanded ? undefined : 'page-grid'}
        style={expanded
          ? { display: 'flex', flexDirection: 'column', gap: 10 }
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 10 }}
      >
      {parameterChecks.map(pc => {
        const key = `${pc.event_name}_${pc.parameter_name}`
        const isLoading = loading[key]
        const error = errors[key]
        const result = data[key]

        return (
          <div key={key}>
            {isLoading && (
              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Analyzing <span style={{ fontFamily: 'var(--font-mono)' }}>{pc.event_name} › {pc.parameter_name}</span>…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {error && (
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#92400e', margin: '0 0 6px', fontFamily: 'monospace' }}>
                  {pc.event_name} › {pc.parameter_name}
                </p>
                {error.hint ? (
                  <>
                    {error.dimension && (
                      <p style={{ fontSize: 11, color: '#ca8a04', margin: '0 0 6px' }}>
                        GA4 dimension queried: <code style={{ background: '#fef9c3', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{error.dimension}</code>
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                      This dimension is not registered in GA4. Go to <strong>GA4 Admin → Custom definitions → Create custom dimension</strong>, scope: Event, parameter name: <code style={{ background: '#fef9c3', padding: '1px 5px', borderRadius: 3 }}>{pc.parameter_name}</code>
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 11, color: '#ca8a04', margin: 0 }}>{error.message}</p>
                )}
              </div>
            )}
            {result && !isLoading && (expanded ? <ParameterCard data={result} /> : <MiniParameterCard data={result} />)}
          </div>
        )
      })}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{ marginTop: 10, fontSize: 12, color: '#7c3aed', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 500 }}
      >
        {expanded ? '← Hide parameter details' : 'Show parameter details →'}
      </button>
    </div>
  )
}
