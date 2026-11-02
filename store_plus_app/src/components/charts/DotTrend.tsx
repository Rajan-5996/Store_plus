import { Cell, CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

interface Props {
  values: number[]
  h?: number
  min?: number
  max?: number
}

/** Bubble timeline: one bubble per day (size = value). Orange = above the period average, blue = at or below. */
export default function DotTrend({ values, h = 170, min, max }: Props) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const data = values.map((v, i) => ({ day: i + 1, value: Math.round(v) }))
  return (
    <div style={{ height: h }} role="img" aria-label="Daily values bubble timeline">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 12, bottom: 0, left: 12 }}>
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="3 4" vertical={false} />
          <XAxis type="number" dataKey="day" hide domain={[0, values.length + 1]} />
          <YAxis type="number" dataKey="value" hide domain={[min ?? 'auto', max ?? 'auto']} />
          <ZAxis dataKey="value" range={[50, 260]} />
          <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '4 4' }} formatter={(v) => [`₹${v}k`, 'Loss']} labelFormatter={() => ''} />
          <ReferenceLine y={avg} stroke={INK} strokeWidth={1.5} strokeDasharray="6 5" />
          <Scatter data={data} isAnimationActive={false} fillOpacity={0.85}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.value > avg ? ORANGE : BLUE} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
