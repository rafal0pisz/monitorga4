// Shared with the demo dashboard (src/lib/demo) — the live Traffic/
// Engagement/Users checks and the demo's static equivalents must render
// pixel-identical cards, so both import this instead of keeping their own
// copy that could silently drift.
export type CheckStatus = 'pass' | 'warn' | 'check' | 'skip'

export interface CheckResult {
  id: string
  section: 'traffic' | 'engagement' | 'users'
  label: string
  description: string
  status: CheckStatus
  valueLabel: string
  prevLabel: string
  deltaLabel: string
  detail?: string
}

export const STATUS: Record<CheckStatus, { label: string; color: string; bg: string; border: string }> = {
  pass:  { label: 'Pass',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  warn:  { label: 'Warn',  color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
  check: { label: 'Check', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  skip:  { label: 'Skip',  color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
}

export const SECTION: Record<string, { label: string; accent: string }> = {
  traffic:    { label: 'Traffic Source',  accent: '#3b82f6' },
  engagement: { label: 'Engagement',      accent: '#8b5cf6' },
  users:      { label: 'Users',           accent: '#0891b2' },
}

// Invert delta colour for metrics where higher = worse
export const INVERT_IDS = ['not_set_share', 'unknown_country', 'bounce_rate', 'self_referral', 'page_title_null', 'bot_traffic_night', 'direct_traffic_spike']

export function CheckCard({ check }: { check: CheckResult }) {
  const st = STATUS[check.status]

  const isPositive = check.deltaLabel.startsWith('+')
  const deltaColor = !check.deltaLabel || ['—', 'All clear'].includes(check.deltaLabel)
    ? 'var(--color-text-secondary)'
    : INVERT_IDS.includes(check.id)
      ? (isPositive ? '#dc2626' : '#16a34a')
      : (isPositive ? '#16a34a' : '#dc2626')

  return (
    <div className="lc-card" style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      {/* Label + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {check.label}
        </span>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 9px', borderRadius: 20,
          color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`,
        }}>
          {st.label}
        </span>
      </div>

      {/* Description — short, gray, small */}
      <p style={{
        margin: '0 0 10px',
        fontSize: 11, lineHeight: 1.5,
        color: 'var(--color-text-secondary)',
      }}>
        {check.description}
      </p>

      {/* Values */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: st.color, lineHeight: 1 }}>
            {check.valueLabel}
          </span>
          {check.prevLabel && (
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
              prev: {check.prevLabel}
            </span>
          )}
        </div>

        {check.deltaLabel && !['—'].includes(check.deltaLabel) && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: deltaColor,
            padding: '2px 7px', borderRadius: 6,
            backgroundColor: deltaColor + '15',
          }}>
            {check.deltaLabel}
          </span>
        )}

        {check.detail && (
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
            {check.detail}
          </span>
        )}
      </div>
    </div>
  )
}

export function SectionBlock({ id, checks }: { id: string; checks: CheckResult[] }) {
  const meta   = SECTION[id]
  const passes = checks.filter(c => c.status === 'pass').length
  const total  = checks.length
  const scoreColor = passes === total ? '#16a34a' : passes > total / 2 ? '#ca8a04' : '#dc2626'

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid var(--color-border-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: meta.accent }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {meta.label}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: scoreColor }}>
          {passes}/{total} passed
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: 10,
      }}>
        {checks.map(c => <CheckCard key={c.id} check={c} />)}
      </div>
    </div>
  )
}
