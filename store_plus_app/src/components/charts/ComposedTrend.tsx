import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BLUE, ORANGE, tooltipStyle } from './palette'

interface Props {
  values: number[]
  h?: number
  /** Moving-average window for the trend line. */
  window?: number
  min?: number
  max?: number
}

/** Daily values as orange bars with a blue moving-average trend line on top. */
export default function ComposedTrend({ values, h = 150, window: win = 7, min, max }: Props) {
  const data = values.map((v, i) => {
    const from = Math.max(0, i - win + 1)
    const slice = values.slice(from, i + 1)
    return { i, daily: Math.round(v), trend: Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) }
  })
  return (
    <div style={{ height: h }} role="img" aria-label="Daily values with moving-average trend">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }} barCategoryGap="12%">
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis hide domain={[min ?? 'auto', max ?? 'auto']} />
          <Tooltip {...tooltipStyle} labelFormatter={() => ''} />
          <Bar dataKey="daily" name="Daily" fill={ORANGE} fillOpacity={0.55} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line type="monotone" dataKey="trend" name={`${win}-day average`} stroke={BLUE} strokeWidth={3} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
