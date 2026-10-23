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

// Renders a visible, permanent dot only on the LAST point of a line — a
// tap/hover tooltip answers "is this current" only for whatever point you
// happen to land on, which on a 20-point weekly chart is easy to miss by a
// pixel or two near the tightly-spaced recent end. This makes "here is the
// most recent data point" unambiguous without needing to interact at all.
function lastPointDot(color: string, lastIndex: number) {
  return (props: any) => {
    const { cx, cy, index, key } = props
    if (index !== lastIndex || cx == null || cy == null) return <g key={key} />
    return <circle key={key} cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
  }
}

export default function AdminGrowthChart({ data }: { data: GrowthPoint[] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
        No data yet
      </div>
    )
  }

  const latest = data[data.length - 1]
  const lastIndex = data.length - 1

  return (
    <div>
      {/* Static, unambiguous "as of" line — doesn't depend on tapping the
          right pixel to find out whether the chart is actually current. */}
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
        As of <strong style={{ color: 'var(--color-text-primary)' }}>{fmtBucket(latest.bucket)}</strong>: {latest.projects} project{latest.projects !== 1 ? 's' : ''}, {latest.users} user{latest.users !== 1 ? 's' : ''}
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false} />
          {/* interval="preserveStartEnd" — without it Recharts' default tick
              thinning (picking an even stride through however many buckets
              exist) can drop the very last bucket's label whenever it isn't a
              multiple of that stride, making the chart look like it stopped
              updating days or weeks ago even though the data (and the line
              itself) already extends to today. */}
          <XAxis dataKey="bucket" interval="preserveStartEnd" tickFormatter={fmtBucket} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={{ stroke: 'var(--color-border-tertiary)' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label) => fmtBucket(String(label))}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="users" name="Users" stroke="#16a34a" strokeWidth={2} dot={data.length <= 14 ? true : lastPointDot('#16a34a', lastIndex)} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="projects" name="Projects" stroke="#1d4ed8" strokeWidth={2} dot={data.length <= 14 ? true : lastPointDot('#1d4ed8', lastIndex)} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
