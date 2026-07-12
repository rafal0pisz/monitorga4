'use client'

import { LineChart, Line, ReferenceLine, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { scoreColor } from '@/types'

interface RunPoint {
  run_date: string
  score_total: number | null
}

// Deliberately compact on desktop — this sits inline above the live checks
// panel, not as a full dashboard chart. Width is capped at ~2x the old
// static sparkline (160px). On mobile it instead goes full-width (below,
// via .score-trend-card/.score-trend-inner) to match the width of the
// Overall Score card above it — the fixed 320px used to make this card
// visibly narrower than its neighbor once the viewport was wider than
// ~350px, since it never adapted to the actual screen width like every
// other card on this page.
const WIDTH = 320
const HEIGHT = 90

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ScoreTrendChart({ runs, alertThreshold }: { runs: RunPoint[]; alertThreshold: number }) {
  const filtered = runs.filter(r => r.score_total != null)
  if (filtered.length < 2) return null

  const data = filtered
    .slice()
    .reverse() // oldest → newest
    .map(r => ({ date: r.run_date, score: Math.round(r.score_total!) }))

  const latestScore = data[data.length - 1].score
  const prevScore = data[data.length - 2].score
  const delta = latestScore - prevScore
  const col = scoreColor(latestScore)

  return (
    <>
      <style>{`
        .score-trend-card { display: inline-block; max-width: 100%; padding: 10px 16px 8px; }
        .score-trend-inner { width: ${WIDTH}px; max-width: 100%; }
        @media (max-width: 640px) {
          .score-trend-card { display: block; padding: 10px 12px 8px; }
          .score-trend-inner { width: 100%; }
        }
      `}</style>
      <div className="score-trend-card" style={{
        marginBottom: 16,
        backgroundColor: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-tertiary)',
        borderRadius: 10,
      }}>
        <div className="score-trend-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Score trend · {data.length} runs
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
              {delta >= 0 ? '+' : ''}{delta} vs prev
            </div>
          </div>

          <ResponsiveContainer width="100%" height={HEIGHT}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} hide />
              <ReferenceLine y={alertThreshold} stroke="#9ca3af" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11, padding: '4px 8px' }}
                labelFormatter={(label) => fmtDate(String(label))}
                formatter={(value) => [value, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke={col} strokeWidth={2} dot={data.length <= 14} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
