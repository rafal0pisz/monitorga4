import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Project, DqsRun, DqsResult, ChecksCatalog } from '@/types'
import { getScoreGrade } from '@/types'

const G = {
  color:  { excellent:'#16a34a', good:'#ca8a04', warning:'#ea580c', critical:'#dc2626' },
  bg:     { excellent:'#f0fdf4', good:'#fefce8', warning:'#fff7ed', critical:'#fef2f2' },
  border: { excellent:'#bbf7d0', good:'#fef08a', warning:'#fed7aa', critical:'#fecaca' },
  label:  { excellent:'Excellent', good:'Good', warning:'Warning', critical:'Critical' },
}
const ST = {
  accent: { pass:'#16a34a', warn:'#ca8a04', fail:'#dc2626' },
  color:  { pass:'#16a34a', warn:'#ca8a04', fail:'#dc2626' },
  bg:     { pass:'#dcfce7', warn:'#fef9c3', fail:'#fee2e2' },
  icon:   { pass:'✓', warn:'!', fail:'✕' },
}

function getWoWRanges() {
  const today = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  const endC = new Date(today); endC.setDate(today.getDate() - 1)
  const startC = new Date(endC); startC.setDate(endC.getDate() - 6)
  const endP = new Date(startC); endP.setDate(startC.getDate() - 1)
  const startP = new Date(endP); startP.setDate(endP.getDate() - 6)
  return { current: `${fmt(startC)} – ${fmt(endC)}`, prev: `${fmt(startP)} – ${fmt(endP)}` }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: project } = await supabase.from('projects').select('*').eq('share_token', token).single()
  if (!project) notFound()

  const p = project as Project
  const [{ data: lastRun }, { data: catalog }] = await Promise.all([
    supabase.from('dqs_runs').select('*').eq('project_id', p.id).eq('status', 'completed').order('run_date', { ascending: false }).limit(1).single(),
    supabase.from('checks_catalog').select('*'),
  ])

  const run = lastRun as DqsRun | null
  const cat = (catalog ?? []) as ChecksCatalog[]
  let results: DqsResult[] = []
  if (run) {
    const { data } = await supabase.from('dqs_results').select('*').eq('run_id', run.id).order('status')
    results = (data ?? []) as DqsResult[]
  }

  const grade = getScoreGrade(run?.score_total ?? null)
  const ranges = getWoWRanges()
  const passCount = results.filter(r => r.status === 'pass').length
  const failCount = results.filter(r => r.status === 'fail').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <nav style={{ background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>GA4 <span style={{ color: '#16a34a' }}>Quality Score</span></span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>bettersteps.pl</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>{p.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>{p.ga4_property_id}</p>
        </div>

        {/* Period bar */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '9px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📅 Okres weryfikacji</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-text-primary)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }}/><strong>{ranges.current}</strong></span>
            <span style={{ color: 'var(--color-text-secondary)' }}>vs {ranges.prev}</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'var(--color-background-info)', color: 'var(--color-text-info)' }}>WoW</span>
          </div>
        </div>

        {/* Score */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
          {run ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Quality Score</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 500, lineHeight: 1, color: G.color[grade] }}>{Math.round(run.score_total ?? 0)}</span>
                  <span style={{ fontSize: 14, color: 'var(--color-border-primary)', marginBottom: 4 }}>/100</span>
                </div>
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 6, background: G.bg[grade], border: `0.5px solid ${G.border[grade]}`, color: G.color[grade] }}>{G.label[grade]}</span>
              </div>
              <div style={{ paddingLeft: 24, borderLeft: '0.5px solid var(--color-border-tertiary)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Podsumowanie</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span><strong style={{ color: '#16a34a' }}>{passCount}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>OK</span></span>
                  <span><strong style={{ color: '#dc2626' }}>{failCount}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>wymaga uwagi</span></span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
                  {new Date(run.run_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Raport zostanie opublikowany wkrótce</p>
          )}
        </div>

        {/* Checks */}
        {results.length > 0 && (
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>Wyniki checków</p>
            </div>
            {results.map(r => {
              const def = cat.find(c => c.check_key === r.check_key)
              const st = r.status as 'pass' | 'warn' | 'fail'
              return (
                <div key={r.check_key} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 4, flexShrink: 0, background: ST.accent[st] }} />
                  <div style={{ flex: 1, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: ST.bg[st], color: ST.color[st], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{ST.icon[st]}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 2px', color: 'var(--color-text-primary)' }}>{def?.label ?? r.check_key}</p>
                      <p style={{ fontSize: 12, margin: 0, color: ST.color[st] }}>{r.message}</p>
                    </div>
                  </div>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 5, background: ST.bg[st], color: ST.color[st] }}>{r.score.toFixed(0)}/{r.weight.toFixed(0)} pkt</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 32 }}>
          Raport wygenerowany przez <span style={{ color: '#16a34a' }}>bettersteps.pl</span>
        </p>
      </div>
    </div>
  )
}
