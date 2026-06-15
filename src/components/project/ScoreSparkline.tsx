'use client'

import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ScoreHistory } from '@/types'

export default function ScoreSparkline({ data }: { data: ScoreHistory[] }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-[#6B7280]">Brak danych historycznych</p>
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <ReferenceLine y={70} stroke="#2e3940" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: '#232b31', border: '1px solid #2e3940', borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => [`${Math.round(value)}`, 'Score']}
          labelFormatter={(label) => new Date(label).toLocaleDateString('pl-PL')}
        />
        <Line
          type="monotone"
          dataKey="score_total"
          stroke="#84cc16"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#84cc16' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
