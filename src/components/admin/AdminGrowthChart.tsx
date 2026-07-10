'use client'

import { LineChart, Line, Tooltip, Legend, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from 'recharts'

export interface GrowthPoint {
  bucket: string
  users: number
  projects: number
}

function fmtBucket(bucket: string) {
  const d = new Date(bucket + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AdminGrowthChart({ data }: { data: GrowthPoint[] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false} />
        <XAxis dataKey="bucket" tickFormatter={fmtBucket} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border-tertiary)' }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(label) => fmtBucket(String(label))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="users" name="Users" stroke="#16a34a" strokeWidth={2} dot={data.length <= 14} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="projects" name="Projects" stroke="#1d4ed8" strokeWidth={2} dot={data.length <= 14} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
