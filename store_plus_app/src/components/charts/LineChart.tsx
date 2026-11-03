import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { tick } from './axis'
import { ALERT, INK, MUTED, resolveColor, tooltipStyle } from './palette'

export interface Series {
  v: number[]
  c?: string
  w?: number
}

interface Props {
  series: Series[]
  h?: number
  min?: number
  max?: number
  /** Shaded x-range in point indexes. */
  shade?: [number, number]
  /** Horizontal reference line value. */
  refY?: number
  /** Vertical marker at point index. */
  vline?: number
  /** Tooltip heading per point (e.g. the hour), the series name and unit, and whether to draw the value axis. */
  labels?: string[]
  name?: string
  unit?: string
  yAxis?: boolean
}

/** Recharts line chart with real colours (legacy theme colours are mapped to real ones). */
export default function LineChart({ series, h = 150, min, max, shade, refY, vline, labels, name, unit = '', yAxis }: Props) {
  const n = Math.max(...series.map((s) => s.v.length))
  const data = Array.from({ length: n }, (_, i) => {
    const row: Record<string, number> = { i }
    series.forEach((s, k) => {
      if (i < s.v.length) row[`s${k}`] = Number(s.v[i].toFixed(2))
    })
    return row
  })
  return (
    <div style={{ height: h }} role="img" aria-label="Line chart">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis hide={!yAxis} domain={[min ?? 'auto', max ?? 'auto']} tick={tick} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(i) => labels?.[Number(i)] ?? ''}
            formatter={(v) => [`${v}${unit}`, name ?? 'Value']}
          />
          {shade && <ReferenceArea x1={shade[0]} x2={shade[1]} fill={ALERT} fillOpacity={0.12} />}
          {refY != null && <ReferenceLine y={refY} stroke={INK} strokeWidth={2} strokeDasharray="6 5" />}
          {vline != null && <ReferenceLine x={vline} stroke={MUTED} strokeWidth={1.5} strokeDasharray="3 4" />}
          {series.map((s, k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={`s${k}`}
              stroke={resolveColor(s.c)}
              strokeWidth={s.w ?? 3}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  )
}
