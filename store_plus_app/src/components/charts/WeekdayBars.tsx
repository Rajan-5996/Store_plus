import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt } from '../../lib/format'
import { gridStroke, tick } from './axis'
import { BLUE, ORANGE, tooltipStyle } from './palette'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Average orders per day of the week; the busiest day is orange and the quietest is outlined by its low bar. */
export default function WeekdayBars({ dates, orders, h = 260 }: { dates: string[]; orders: number[]; h?: number }) {
  const sums = DAYS.map(() => ({ total: 0, n: 0 }))
  dates.forEach((d, i) => {
    const k = (new Date(d).getUTCDay() + 6) % 7 // Monday first
    sums[k].total += orders[i]
    sums[k].n += 1
  })
  const data = DAYS.map((day, i) => ({ day, avg: sums[i].n ? Math.round(sums[i].total / sums[i].n) : 0 }))
  const best = Math.max(...data.map((x) => x.avg))
  return (
    <div style={{ height: h }} role="img" aria-label="Average orders by day of week">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={false} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={42} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v)), 'Average orders']} />
          <Bar dataKey="avg" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {data.map((x) => (
              <Cell key={x.day} fill={x.avg === best ? ORANGE : BLUE} />
            ))}
            <LabelList dataKey="avg" position="top" formatter={(v) => fmt(Number(v))} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
