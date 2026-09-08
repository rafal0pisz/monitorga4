import type { CSSProperties } from 'react'
import Link from 'next/link'
import { getScoreGrade, SCORE_GRADE_STYLE as G } from '@/types'
import { DEMO_PROJECTS, DEMO_LATEST_RUN_DATE } from '@/lib/demo/data'

// Static twin of app/dashboard/page.tsx (the real "Overview" list) — same
// stat tiles and project rows, fed DEMO_PROJECTS instead of a Supabase
// query. See app/demo/layout.tsx for why this whole subtree skips auth.
function statusChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px 2.5px 7px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}
function chipDotStyle(on: boolean): CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: on ? '#16a34a' : 'var(--color-text-tertiary)' }
}
function countChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}
function countValueStyle(on: boolean): CSSProperties {
  return { fontFamily: 'var(--font-mono)', fontWeight: 700, color: on ? '#166534' : 'var(--color-text-primary)' }
}

export default function DemoOverviewPage() {
  const list = DEMO_PROJECTS
  const avgScore = Math.round(list.reduce((s, p) => s + p.last_score, 0) / list.length)
  const critical = list.filter(p => ['critical', 'warning'].includes(getScoreGrade(p.last_score))).length
  const dailyCheckCount = list.filter(p => p.status === 'active' && p.auto_run).length
  const emailAlertCount = list.filter(p => !!p.alert_email).length

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        padding: '10px 14px', borderRadius: 10, background: '#f0fdfa', border: '0.5px solid #99f6e4',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: '#0e9488' }} />
        <span style={{ fontSize: 12.5, color: '#0f766e' }}>
          You’re viewing a demo with fixed example data — no login required. <Link href="/login" style={{ color: '#0e9488', fontWeight: 600, textDecoration: 'underline' }}>Sign up</Link> to connect your own GA4 property.
        </span>
      </div>

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{list.length} monitored GA4 properties · last run {DEMO_LATEST_RUN_DATE}</p>
        </div>
      </div>

      <div className="dashboard-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Projects', value: list.length, sub: 'monitored' },
          { label: 'Avg score', value: avgScore, sub: 'all projects' },
          { label: 'Need attention', value: critical, sub: 'warning or critical' },
          { label: 'Daily check', value: `${dailyCheckCount} / ${list.length}`, sub: 'enabled' },
          { label: 'Email alerts', value: `${emailAlertCount} / ${list.length}`, sub: 'configured' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>All projects</span>
        </div>
        {list.map((p, i) => {
          const grade = getScoreGrade(p.last_score)
          const diff = Math.round(p.last_score - p.prev_week_score)
          return (
            <Link key={p.id} href={`/demo/project/${p.id}`} style={{ textDecoration: 'none', display: 'block', borderBottom: i < list.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px 4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: G[grade].color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 1px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 11, margin: 0, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.ga4_property_id}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: diff >= 0 ? '#16a34a' : '#dc2626' }}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: G[grade].bg, border: `0.5px solid ${G[grade].border}`, borderRadius: 6, padding: '3px 10px' }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: G[grade].color, lineHeight: 1 }}>{Math.round(p.last_score)}</span>
                    <span style={{ fontSize: 11, color: G[grade].color }}>{G[grade].label}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '0 20px 12px 42px' }}>
                <span style={statusChipStyle(!!p.alert_email)}><span style={chipDotStyle(!!p.alert_email)} />Email</span>
                <span style={statusChipStyle(p.auto_run)}><span style={chipDotStyle(p.auto_run)} />Daily</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>Conf.</span>
                <span style={countChipStyle(p.ecommerce_events_count > 0)}>E-com <b style={countValueStyle(p.ecommerce_events_count > 0)}>{p.ecommerce_events_count}</b></span>
                <span style={countChipStyle(p.custom_events_count > 0)}>Events <b style={countValueStyle(p.custom_events_count > 0)}>{p.custom_events_count}</b></span>
                <span style={countChipStyle(p.parameter_checks_count > 0)}>Params <b style={countValueStyle(p.parameter_checks_count > 0)}>{p.parameter_checks_count}</b></span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
