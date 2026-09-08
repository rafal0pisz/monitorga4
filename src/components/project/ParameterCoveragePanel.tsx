'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'
import { type ParameterData, MiniParameterCard, ParameterCard } from './ParameterCardShared'

export type { ParameterData }

interface Props {
  projectId: string
  parameterChecks: { event_name: string; parameter_name: string }[]
  periodDays: number
  anchorOffset?: number
}

export default function ParameterCoveragePanel({ projectId, parameterChecks, periodDays, anchorOffset = 0 }: Props) {
  // This is now the only Period-reactive parameter view (the stored daily
  // card was dropped — see the project page), so it fetches eagerly rather
  // than waiting on a click. Shown as compact MiniParameterCards by
  // default; "Show parameter details" reveals the fuller ParameterCard
  // (coverage bar, date ranges, top values) using this same fetched data.
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<Record<string, ParameterData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, { message: string; dimension?: string; hint?: string }>>({})

  useEffect(() => {
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
        .then(res => res.json())
        .then(json => {
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
        .catch(err => setErrors(prev => ({ ...prev, [key]: { message: err.message } })))
        .finally(() => setLoading(prev => ({ ...prev, [key]: false })))
    }
  }, [projectId, JSON.stringify(parameterChecks), periodDays, anchorOffset])

  if (parameterChecks.length === 0) return null

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
