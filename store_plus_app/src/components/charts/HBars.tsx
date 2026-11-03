import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BLUE, ORANGE, tooltipStyle } from './palette'
import { tick } from './axis'

export interface HRow {
  name: string
  value: number
  /** Text shown at the end of the bar (defaults to the value). */
  label?: string
  /** Orange instead of blue: this row needs attention. */
  hot?: boolean
}

/** Horizontal bars with the name on the left and a label at the end of each bar. */
export default function HBars({ rows, h, nameWidth = 150, labelWidth = 150 }: { rows: HRow[]; h?: number; nameWidth?: number; labelWidth?: number }) {
  const height = h ?? Math.max(120, rows.length * 38 + 16)
  return (
    <div style={{ height }} role="img" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 2, right: labelWidth, bottom: 2, left: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="name" width={nameWidth} tick={{ ...tick, fontSize: 12 }} tickLine={false} axisLine={false} interval={0} />
          <Tooltip {...tooltipStyle} formatter={(v, _n, item) => [(item.payload as HRow).label ?? String(v), (item.payload as HRow).name]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} background={{ fill: 'rgba(100,116,139,.10)', radius: 6 }} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.hot ? ORANGE : BLUE} />
            ))}
            <LabelList dataKey="label" position="right" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--ink)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
