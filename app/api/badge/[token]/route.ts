import { createAdminClient } from '@/lib/supabase/server'
import { getScoreGrade, SCORE_GRADE_STYLE } from '@/types'

// Small embeddable status badge (shields.io-style) for a client's own site —
// wrapped in an <a> pointing at alertga4.bettersteps.pl by the caller. Kept
// to fixed brand text + computed score digits only (no project name), so
// there's nothing user-controlled to escape when building the SVG string.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: project } = await supabase.from('projects').select('id').eq('share_token', token).single()

  let score: number | null = null
  if (project) {
    const { data: run } = await supabase
      .from('dqs_runs')
      .select('score_total')
      .eq('project_id', project.id)
      .eq('status', 'completed')
      .order('run_date', { ascending: false })
      .limit(1)
      .single()
    score = run?.score_total ?? null
  }

  const style = SCORE_GRADE_STYLE[getScoreGrade(score)]
  const scoreLabel = score != null ? `${Math.round(score)}/100` : '—'
  const width = 168
  const height = 36

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="6" fill="#232b31"/>
  <circle cx="16" cy="${height / 2}" r="4" fill="${style.color}"/>
  <text x="28" y="${height / 2 + 4}" font-family="Arial, sans-serif" font-size="12" fill="#ffffff">AlertGA4</text>
  <text x="94" y="${height / 2 + 4}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${style.color}">${scoreLabel}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
