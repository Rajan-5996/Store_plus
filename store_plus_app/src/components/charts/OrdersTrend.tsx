import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt } from '../../lib/format'
import { gridStroke, shortDate, tick } from './axis'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

interface Props {
  dates: string[]
  orders: number[]
  breakEven: number | null
  h?: number
}

/** Orders per day as an area, its 7-day average as a line, and the break-even level as a dashed rule. */
export default function OrdersTrend({ dates, orders, breakEven, h = 300 }: Props) {
  const data = dates.map((d, i) => {
    const w = orders.slice(Math.max(0, i - 6), i + 1)
    return { d: shortDate(d), orders: orders[i], avg: Math.round(w.reduce((a, b) => a + b, 0) / w.length) }
  })
  const top = Math.max(...orders, breakEven ?? 0) * 1.12
  return (
    <div style={{ height: h }} role="img" aria-label="Orders per day against the break-even level">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="d" tick={tick} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={46} domain={[0, top]} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v, name) => [fmt(Number(v)), name === 'orders' ? 'Orders' : '7-day average']} />
          <Area dataKey="orders" stroke={ORANGE} strokeWidth={2} fill="url(#ordersFill)" isAnimationActive={false} />
          <Line dataKey="avg" stroke={BLUE} strokeWidth={3} dot={false} isAnimationActive={false} />
          {breakEven != null && (
            <ReferenceLine
              y={breakEven}
              stroke={INK}
              strokeDasharray="6 5"
              strokeWidth={2}
              label={{ value: `Break-even ${fmt(breakEven)}`, position: 'insideTopRight', fill: INK, fontSize: 12, fontWeight: 700 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
