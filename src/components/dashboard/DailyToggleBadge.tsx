'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusChipStyle, chipDotStyle } from '@/components/dashboard/chipStyles'

// Lets an owner flip a project's daily-check on/off right from the "All
// projects" list, instead of having to open Settings → Save settings for
// a single boolean. Writes `auto_run` directly (same field, same RLS-backed
// write ProjectConfigForm's toggle eventually persists) — this is the only
// field this control ever touches, so it can't clobber unrelated settings
// someone has unsaved elsewhere on that project's config page.
export default function DailyToggleBadge({
  projectId, projectName, initialAutoRun, projectStatus,
}: { projectId: string; projectName: string; initialAutoRun: boolean; projectStatus: string }) {
  const [autoRun, setAutoRun] = useState(initialAutoRun)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const on = projectStatus === 'active' && autoRun
  const next = !autoRun
  const isPaused = projectStatus !== 'active'

  async function confirm() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: updErr } = await supabase.from('projects').update({ auto_run: next }).eq('id', projectId)
      if (updErr) throw new Error(updErr.message)
      setAutoRun(next)
      setConfirming(false)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setError(null); setConfirming(true) }}
        style={{ ...statusChipStyle(on), cursor: 'pointer', font: 'inherit' }}
      >
        <span style={chipDotStyle(on)} />Daily
      </button>

      {confirming && (
        <div
          onClick={e => { e.preventDefault(); e.stopPropagation(); if (!saving) setConfirming(false) }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 380, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '24px 24px 20px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
              {next ? 'Turn on daily checks?' : 'Turn off daily checks?'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px', lineHeight: 1.5 }}>
              {next
                ? <>AlertGA4 will start checking <strong>{projectName}</strong> automatically every morning (6:30–8:30 Warsaw time).</>
                : <>AlertGA4 will stop checking <strong>{projectName}</strong> automatically — you can still run it manually from the project page.</>}
            </p>
            {next && isPaused && (
              <p style={{ fontSize: 12, color: '#9a3412', background: '#fff7ed', border: '0.5px solid #fdba74', borderRadius: 8, padding: '8px 10px', margin: '0 0 16px', lineHeight: 1.5 }}>
                This project is currently <strong>paused</strong> — reactivate it in Settings for daily checks to actually run.
              </p>
            )}
            {error && (
              <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '8px 10px', margin: '0 0 16px' }}>{error}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: error || (next && isPaused) ? 0 : 16 }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={saving}
                style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#ffffff', color: '#111827', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: 'none', color: '#fff', backgroundColor: saving ? '#86efac' : '#16a34a', cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Saving…' : next ? 'Turn on' : 'Turn off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
