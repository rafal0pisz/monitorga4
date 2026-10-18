'use client'

import { useState } from 'react'

export default function DangerZone() {
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Could not export your data — please try again.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'alertga4-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not delete your account.')
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: confirmOpen ? 16 : 0 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>Export your data</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Download a JSON file with your account, projects, and check history.</p>
        </div>
        <button
          type="button" onClick={handleExport} disabled={exporting}
          style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', cursor: exporting ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {exporting ? 'Preparing…' : 'Export data'}
        </button>
      </div>

      <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '16px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#dc2626', margin: '0 0 2px' }}>Delete account</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Permanently deletes your account, projects, and check history. This can&apos;t be undone.</p>
        </div>
        {!confirmOpen && (
          <button
            type="button" onClick={() => setConfirmOpen(true)}
            style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Delete account…
          </button>
        )}
      </div>

      {confirmOpen && (
        <div style={{ marginTop: 14, padding: '14px 16px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 10 }}>
          <p style={{ fontSize: 12.5, color: '#991b1b', margin: '0 0 10px' }}>
            If you have an active paid plan, cancel it first under &quot;Manage billing&quot; above. Type <b>DELETE</b> to confirm — this immediately and permanently removes your account, every project, and all check history.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE"
              style={{ fontSize: 13, padding: '7px 10px', borderRadius: 7, border: '1px solid #fecaca', width: 120 }}
            />
            <button
              type="button" onClick={handleDelete} disabled={confirmText !== 'DELETE' || deleting}
              style={{ background: confirmText === 'DELETE' ? '#dc2626' : '#fca5a5', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#fff', cursor: confirmText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed' }}
            >
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              type="button" onClick={() => { setConfirmOpen(false); setConfirmText(''); setError(null) }}
              style={{ background: 'transparent', border: 'none', fontSize: 12.5, color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12.5, color: '#dc2626', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
