'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function RunNowButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function handleRun() {
    setLoading(true)
    try {
      await fetch('/api/worker/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-manual-trigger': '1' }, body: JSON.stringify({ project_id: projectId }) })
      router.refresh()
    } finally { setLoading(false) }
  }
  return (
    <button onClick={handleRun} disabled={loading} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, background: loading ? '#86efac' : '#16a34a', color: '#fff', fontWeight: 500, border: 'none', cursor: loading ? 'wait' : 'pointer' }}>
      {loading ? '⏳ Running...' : '▶ Run now'}
    </button>
  )
}
