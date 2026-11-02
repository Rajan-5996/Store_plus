import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { rupee, rupeeShort } from '../../lib/format'
import { gridStroke, shortDate, tick } from './axis'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

/** One bar per day: blue when the store made money, orange when it lost money. */
export default function PnlBars({ dates, values, h = 250 }: { dates: string[]; values: number[]; h?: number }) {
  const data = dates.map((d, i) => ({ d: shortDate(d), v: values[i] }))
  return (
    <div style={{ height: h }} role="img" aria-label="Daily profit and loss">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="d" tick={tick} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => rupeeShort(v)} />
          <Tooltip {...tooltipStyle} formatter={(v) => [rupee(Number(v)), 'Profit / loss']} />
          <ReferenceLine y={0} stroke={INK} strokeWidth={1.5} />
          <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((p, i) => (
              <Cell key={i} fill={p.v >= 0 ? BLUE : ORANGE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
