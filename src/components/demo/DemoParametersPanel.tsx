'use client'

import { useState } from 'react'
import { type ParameterData, MiniParameterCard, ParameterCard } from '@/components/project/ParameterCardShared'

// Static twin of ParameterCoveragePanel — same expand/collapse behaviour and
// the exact same card components, fed a fixed array instead of fetching
// from /api/ga4/parameters.
export default function DemoParametersPanel({ parameters }: { parameters: ParameterData[] }) {
  const [expanded, setExpanded] = useState(false)
  if (parameters.length === 0) return null

  return (
    <div>
      <div
        className={expanded ? undefined : 'page-grid'}
        style={expanded
          ? { display: 'flex', flexDirection: 'column', gap: 10 }
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 10 }}
      >
        {parameters.map(p => (
          <div key={`${p.event_name}_${p.parameter_name}`}>
            {expanded ? <ParameterCard data={p} /> : <MiniParameterCard data={p} />}
          </div>
        ))}
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
