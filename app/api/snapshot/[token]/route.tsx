import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/server'
import { getScoreGrade, SCORE_GRADE_STYLE } from '@/types'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Social-shareable snapshot of a project's current score — same share_token
// as the public /share/[token] page, so it needs no separate auth. Meant to
// be opened and manually posted (LinkedIn, etc.), not embedded live.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: project } = await supabase.from('projects').select('id, name').eq('share_token', token).single()
  if (!project) return new Response('Not found', { status: 404 })

  const { data: run } = await supabase
    .from('dqs_runs')
    .select('score_total, run_date')
    .eq('project_id', project.id)
    .eq('status', 'completed')
    .order('run_date', { ascending: false })
    .limit(1)
    .single()

  const score = run?.score_total ?? null
  const grade = getScoreGrade(score)
  const style = SCORE_GRADE_STYLE[grade]
  const dateLabel = run?.run_date
    ? new Date(run.run_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#232b31',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, fontStyle: 'italic', letterSpacing: -1, marginBottom: 40 }}>
          <span style={{ color: '#ffffff' }}>Alert</span>
          <span style={{ color: '#fffd73' }}>GA4.</span>
        </div>

        {score != null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ display: 'flex', fontSize: 180, fontWeight: 700, lineHeight: 1, color: style.color }}>{Math.round(score)}</div>
              <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.5)', marginBottom: 22 }}>/100</div>
            </div>
            <div
              style={{
                display: 'flex', fontSize: 26, fontWeight: 600, padding: '7px 22px', borderRadius: 999, marginTop: 14,
                background: style.bg, color: style.color, border: `2px solid ${style.border}`,
              }}
            >
              {style.label}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>Report coming soon</div>
        )}

        <div style={{ display: 'flex', marginTop: 48, fontSize: 26, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          {project.name}
        </div>
        {dateLabel && <div style={{ display: 'flex', marginTop: 8, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>{dateLabel}</div>}
        <div style={{ display: 'flex', marginTop: 40, fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>alertga4.bettersteps.pl</div>
      </div>
    ),
    { ...size }
  )
}
