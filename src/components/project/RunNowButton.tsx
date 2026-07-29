'use client'
import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
export default function RunNowButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  async function handleRun() {
    setLoading(true)
    try {
      await fetch('/api/worker/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-manual-trigger': '1' }, body: JSON.stringify({ project_id: projectId }) })
      // A plain router.refresh() only re-renders server data (score,
      // history, stored check cards) — the live GA4 panels (Traffic/
      // Engagement/Users/Events/Parameters) are client components with
      // their own useEffect, which won't re-fire just because the server
      // data changed. Bumping `ran` in the URL gives them a new React key
      // (set in the project page) so they remount and actually refetch.
      const params = new URLSearchParams(searchParams.toString())
      params.set('ran', String(Date.now()))
      router.push(`${pathname}?${params.toString()}`)
    } finally { setLoading(false) }
  }
  return (
    <button onClick={handleRun} disabled={loading} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, background: loading ? '#86efac' : '#16a34a', color: '#fff', fontWeight: 500, border: 'none', cursor: loading ? 'wait' : 'pointer' }}>
      {loading ? '⏳ Running...' : '▶ Run now'}
    </button>
  )
}
