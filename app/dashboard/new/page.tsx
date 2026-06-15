import NewProjectForm from '@/components/project/NewProjectForm'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', gap: 6 }}>
        <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Projekty</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>Nowy projekt</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Nowy projekt</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 28px' }}>Połącz property GA4 z monitorem jakości</p>
      <NewProjectForm />
    </div>
  )
}
