'use client'

import { useState, useEffect } from 'react'
import { ga4Fetch } from '@/lib/ga4/clientQueue'
import { type CheckResult, SectionBlock } from './CheckCardShared'

export type { CheckResult }

function Loading() {
  return (
    <div style={{ padding: '28px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
        border: '2px solid var(--color-border-tertiary)', borderTopColor: '#16a34a',
        animation: 'lcSpin 0.8s linear infinite',
      }} />
      <style>{`@keyframes lcSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Fetching GA4 data…
      </div>
    </div>
  )
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>GA4 connection error</div>
      <div style={{ fontSize: 11, color: '#991b1b', marginTop: 3 }}>{message}</div>
    </div>
  )
}

// Distinct from ErrorBlock — a lapsed trial/plan (HTTP 402) isn't a GA4
// connection problem, it's an expected, actionable state with its own CTA.
// scope 'member' means it's the project OWNER's plan that lapsed, not the
// viewer's own — they can't fix it via /cennik, so the CTA points at the
// Team page instead (see src/lib/billing/access.ts: trialExpiredPayload).
function UpgradeBlock({ message, scope }: { message: string; scope: 'owner' | 'member' }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#fffbeb', border: '1px solid #fde68a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{scope === 'member' ? "Owner's plan has ended" : 'Trial ended'}</div>
        <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>{message}</div>
      </div>
      {scope === 'member'
        ? <a href="/dashboard/team" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Go to Team →</a>
        : <a href="/cennik" style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade plan →</a>}
    </div>
  )
}

// Distinct from ErrorBlock — an expired/revoked Google token (HTTP 401) has
// one specific fix (sign in with Google again), so it gets its own CTA
// instead of a dead-end red error message. Every live GA4 fetch always
// uses the CURRENT viewer's own token (see app/api/ga4/checks/route.ts) —
// a team member reconnects their own account here, same as the owner.
function ReconnectBlock({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a' }}>Google connection lost</div>
        <div style={{ fontSize: 11, color: '#1e3a8a', marginTop: 2 }}>{message}</div>
      </div>
      <a href="/login" style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Reconnect with Google →</a>
    </div>
  )
}

// Distinct from ReconnectBlock — this isn't a broken/missing connection,
// it's a team member whose Google account has never been granted access to
// this specific GA4 property (see src/lib/ga4/memberAccess.ts). No sign-in
// CTA here — the fix is on the project owner's side, in GA4 itself, not in
// AlertGA4.
function NoAccessBlock({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>🔒 No Google Analytics access yet</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{message}</div>
    </div>
  )
}

interface Props { projectId: string; period: number; anchorOffset?: number; extraChecks?: CheckResult[] }

const LCStyle = () => (
  <style>{`
    @media (max-width: 600px) {
      .lc-grid { grid-template-columns: 1fr !important; }
      .lc-nav  { flex-wrap: wrap; gap: 8px !important; }
      .lc-card { padding: 12px 12px !important; }
    }
  `}</style>
)
// lcResponsive

export default function LiveChecksPanel({ projectId, period, anchorOffset = 0, extraChecks = [] }: Props) {
  const [checks,  setChecks]  = useState<CheckResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [blockedScope, setBlockedScope] = useState<'owner' | 'member'>('owner')
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [noAccess, setNoAccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setBlocked(false); setNeedsReconnect(false); setNoAccess(false)

    ga4Fetch('/api/ga4/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, period, anchorOffset }),
    })
      .then(async r => {
        const d = await r.json()
        if (cancelled) return
        if (d.error) {
          if (r.status === 402) { setBlocked(true); setBlockedScope(d.scope === 'member' ? 'member' : 'owner'); setError(d.error); return }
          if (r.status === 401) { setNeedsReconnect(true); setError(d.error); return }
          if (r.status === 403) { setNoAccess(true); setError(d.error); return }
          throw new Error(d.error)
        }
        setChecks(d.checks)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, period, anchorOffset])

  // extraChecks (from the last daily run) render immediately — they don't
  // depend on the live GA4 fetch above, so a slow/failed live fetch
  // shouldn't hide them.
  const merged = [...(checks ?? []), ...extraChecks]
  const showSections = merged.length > 0

  return (
    <div>
      {loading && !showSections && <Loading />}
      {error && (blocked ? <UpgradeBlock message={error} scope={blockedScope} /> : needsReconnect ? <ReconnectBlock message={error} /> : noAccess ? <NoAccessBlock message={error} /> : <ErrorBlock message={error} />)}
      {showSections && (['traffic', 'engagement', 'users'] as const).map(s => (
        <SectionBlock key={s} id={s} checks={merged.filter(c => c.section === s)} />
      ))}
    </div>
  )
}
