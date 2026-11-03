import type { CSSProperties } from 'react'

// Shared by the server-rendered project list (app/dashboard/page.tsx) and
// the client-side Daily toggle (DailyToggleBadge.tsx) so both draw the
// exact same chip, whether it's static or interactive.

// Small on/off status chip used in the "All projects" list (e.g. Email,
// Daily) — green when on, muted when off.
export function statusChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px 2.5px 7px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}

export function chipDotStyle(on: boolean): CSSProperties {
  return { width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: on ? '#16a34a' : 'var(--color-text-tertiary)' }
}

// Small count chip (E-com / Events / Params) — green once configured (count >
// 0), same as the Email/Daily status chips. This only reflects whether
// something was configured, not whether it's healthy at scale — hence the
// "Conf." label placed to the left of this chip group.
export function countChipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, fontWeight: 500, borderRadius: 20, padding: '2.5px 9px', whiteSpace: 'nowrap',
    border: `0.5px solid ${on ? '#86efac' : 'var(--color-border-tertiary)'}`,
    background: on ? '#f0fdf4' : 'var(--color-background-tertiary)',
    color: on ? '#166534' : 'var(--color-text-secondary)',
  }
}

export function countValueStyle(on: boolean): CSSProperties {
  return { fontFamily: 'var(--font-mono)', fontWeight: 700, color: on ? '#166534' : 'var(--color-text-primary)' }
}
