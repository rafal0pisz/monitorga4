'use client'

import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine, YAxis, XAxis } from 'recharts'
import type { ScoreHistory } from '@/types'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z') // noon UTC avoids timezone off-by-one
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ScoreSparklineLight({ data, alertThreshold }: { data: ScoreHistory[]; alertThreshold: number }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
        No historical data yet — run checks daily to build trend
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <XAxis dataKey="run_date" hide />
        <YAxis domain={[0, 100]} hide />
        <ReferenceLine y={alertThreshold} stroke="#fca5a5" strokeDasharray="4 3" strokeWidth={1} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [`${Math.round(Number(value ?? 0))}`, 'Score']}
          labelFormatter={(label) => fmtDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="score_total"
          stroke="#16a34a"
          strokeWidth={2}
          dot={data.length <= 7}
          activeDot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
