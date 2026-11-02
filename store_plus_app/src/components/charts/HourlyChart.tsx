import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hourLabel, num1 } from '../../lib/format'
import { gridStroke, tick } from './axis'
import { BLUE, ORANGE, tooltipStyle } from './palette'

interface Hour {
  hour: number
  orders: number
  capacity: number
  lost: number
}

/** Orders accepted against staffed capacity through the day; the bars show orders lost in the hours demand beat capacity. */
export default function HourlyChart({ hours, h = 250 }: { hours: Hour[]; h?: number }) {
  const data = hours.map((x) => ({ ...x, label: hourLabel(x.hour) }))
  return (
    <div style={{ height: h }} role="img" aria-label="Orders against capacity by hour">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="capFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={26} />
          <YAxis yAxisId="o" tick={tick} tickLine={false} axisLine={false} width={34} />
          <YAxis yAxisId="l" orientation="right" tick={tick} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => [num1(Number(v)), name === 'capacity' ? 'Capacity' : name === 'orders' ? 'Orders accepted' : 'Orders lost']}
          />
          <Area yAxisId="o" dataKey="capacity" stroke={BLUE} strokeWidth={2} fill="url(#capFill)" isAnimationActive={false} />
          <Area yAxisId="o" dataKey="orders" stroke={ORANGE} strokeWidth={3} fill="none" isAnimationActive={false} />
          <Bar yAxisId="l" dataKey="lost" fill="#1E293B" barSize={8} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
