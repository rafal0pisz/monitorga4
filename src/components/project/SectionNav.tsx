'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Section {
  key: string
  label: string
  icon: string
  count?: number
  failCount?: number
}

export default function SectionNav({ sections, active }: { sections: Section[]; active: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setSection(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{
      display: 'flex', gap: 2, padding: '3px',
      background: 'var(--color-background-secondary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 10, marginBottom: 16,
      flexWrap: 'wrap',
    }}>
      {sections.map(s => {
        const isActive = s.key === active
        return (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: isActive ? 'var(--color-background-primary)' : 'transparent',
            boxShadow: isActive ? '0 0 0 0.5px var(--color-border-secondary)' : 'none',
            transition: 'all 0.1s',
          }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: 13, color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }} aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
            {s.failCount !== undefined && s.failCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 500, padding: '0px 5px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '0.5px solid #fecaca' }}>
                {s.failCount}
              </span>
            )}
            {s.failCount === 0 && s.count !== undefined && s.count > 0 && (
              <span style={{ fontSize: 10, padding: '0px 5px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}>
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
