import { Area, AreaChart as RAreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BLUE, ORANGE, tooltipStyle } from './palette'

export interface AreaRow {
  label: string
  value: number
}

/** Smooth recharts area chart over named categories: blue gradient area, orange markers and value labels. */
export default function AreaChart({ rows, h = 220 }: { rows: AreaRow[]; h?: number }) {
  return (
    <div style={{ height: h }} role="img" aria-label="Area chart">
      <ResponsiveContainer width="100%" height="100%">
        <RAreaChart data={rows} margin={{ top: 22, right: 18, bottom: 0, left: 18 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.55} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 600 }} interval={0} />
          <YAxis hide domain={[0, 'dataMax + 3']} />
          <Tooltip {...tooltipStyle} cursor={{ stroke: ORANGE, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="value"
            name="Stores"
            stroke={BLUE}
            strokeWidth={3}
            fill="url(#areaFill)"
            dot={{ r: 5, fill: ORANGE, stroke: '#FFF4EC', strokeWidth: 2 }}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          >
            <LabelList dataKey="value" position="top" offset={10} style={{ fontSize: 13, fontWeight: 700 }} />
          </Area>
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
