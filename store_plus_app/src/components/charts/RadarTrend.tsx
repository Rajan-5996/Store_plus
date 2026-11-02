import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { BLUE, ORANGE, tooltipStyle } from './palette'

interface Props {
  values: number[]
  h?: number
  min?: number
  max?: number
}

/** Radar (polar) chart: one spoke per day, orange area = daily value, blue ring = period average. */
export default function RadarTrend({ values, h = 220, min = 0, max }: Props) {
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const peak = Math.max(...values)
  const peakDay = values.indexOf(peak) + 1
  const low = Math.min(...values)
  const lowDay = values.indexOf(low) + 1
  const data = values.map((v, i) => ({ day: `Day ${i + 1}`, value: Math.round(v), average: avg }))
  return (
    <div className="relative" style={{ height: h }} role="img" aria-label="Radar chart of daily values">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="rgba(100,116,139,.28)" />
          <PolarAngleAxis
            dataKey="day"
            tick={{ fontSize: 12, fontWeight: 700, fill: '#64748B' }}
            tickFormatter={(v: string, i: number) => (i % 5 === 0 ? v.replace('Day ', 'D') : '')}
          />
          <PolarRadiusAxis angle={90} domain={[min, max ?? 'auto']} tick={false} axisLine={false} />
          <Tooltip {...tooltipStyle} formatter={(v, name) => [`₹${v}k`, name === 'average' ? '30-day average' : 'Loss']} />
          <Radar name="average" dataKey="average" stroke={BLUE} strokeWidth={2} strokeDasharray="5 4" fill="none" isAnimationActive={false} />
          <Radar name="value" dataKey="value" stroke={ORANGE} strokeWidth={2.5} fill={ORANGE} fillOpacity={0.35} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>

      {/* centre label */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center leading-tight">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">30-day avg</div>
          <div className="text-2xl font-extrabold" style={{ color: BLUE }}>
            ₹{avg}k
          </div>
          <div className="text-[11px] font-semibold text-muted">per day</div>
        </div>
      </div>

      {/* corner call-outs */}
      <div className="pointer-events-none absolute left-0 top-0 text-xs font-semibold leading-snug">
        <div className="font-bold" style={{ color: ORANGE }}>
          Peak ₹{Math.round(peak)}k
        </div>
        <div className="text-muted">Day {peakDay}</div>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 text-right text-xs font-semibold leading-snug">
        <div className="font-bold" style={{ color: BLUE }}>
          Lowest ₹{Math.round(low)}k
        </div>
        <div className="text-muted">Day {lowDay}</div>
      </div>
    </div>
  )
}
