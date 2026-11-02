import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { gridStroke, tick } from './axis'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

export interface Index {
  metric: string
  /** This store as a percentage of the format median (100 = same as the median). */
  format: number | null
  /** This store as a percentage of the network median. */
  network: number | null
}

/** Grouped bars of the store against its peers; the dashed line at 100 is "same as the median". */
export default function PeerIndex({ rows, h = 260 }: { rows: Index[]; h?: number }) {
  const max = Math.max(150, ...rows.flatMap((r) => [r.format ?? 0, r.network ?? 0])) * 1.1
  return (
    <div style={{ height: h }} role="img" aria-label="This store compared with peer medians">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 18, right: 8, bottom: 0, left: 0 }} barGap={4}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="metric" tick={tick} tickLine={false} axisLine={false} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={36} domain={[0, max]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}% of median`, n === 'format' ? 'Same-format median' : 'Network median']} />
          <ReferenceLine y={100} stroke={INK} strokeDasharray="6 5" strokeWidth={2} />
          <Bar dataKey="format" fill={BLUE} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="format" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
          </Bar>
          <Bar dataKey="network" fill={ORANGE} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="network" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
