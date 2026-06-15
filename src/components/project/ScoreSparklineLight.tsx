'use client'

import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts'
import type { ScoreHistory } from '@/types'

export default function ScoreSparklineLight({ data, alertThreshold }: { data: ScoreHistory[]; alertThreshold: number }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>Brak danych historycznych</div>
  }

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <YAxis domain={[0, 100]} hide />
        <ReferenceLine y={alertThreshold} stroke="#fca5a5" strokeDasharray="4 3" strokeWidth={1} />
        <Tooltip
          contentStyle={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 8, fontSize: 12,
            color: 'var(--color-text-primary)',
          }}
          formatter={(value: number) => [`${Math.round(value)}`, 'Score']}
          labelFormatter={(label) => new Date(label).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
        />
        <Line
          type="monotone"
          dataKey="score_total"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
