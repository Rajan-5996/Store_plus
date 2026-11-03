import { Bar, BarChart as RBarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ALERT, BASE, INK, tooltipStyle } from './palette'

interface Props {
  values: number[]
  h?: number
  /** Highlight predicate by bar index (highlighted bars are red, others blue). */
  hi?: (i: number) => boolean
  /** Vertical reference line position as a fraction of the width (0..1). */
  refX?: number
  max?: number
  /** Tooltip heading per bar (e.g. the store) and the series name and unit. */
  labels?: string[]
  name?: string
  unit?: string
}

/** Recharts bar chart in complementary colours (blue + orange). */
export default function BarChart({ values, h = 140, hi, refX, max, labels, name = 'Value', unit = '' }: Props) {
  const data = values.map((v, i) => ({ i, v }))
  const refIdx = refX != null ? Math.min(values.length - 1, Math.floor(refX * values.length)) : -1
  // highlighted bars (or bars left of the reference line, i.e. below the threshold) are orange; the rest are blue
  const colour = (i: number) => (hi ? (hi(i) ? ALERT : BASE) : refIdx >= 0 && i < refIdx ? ALERT : BASE)
  return (
    <div style={{ height: h }} role="img" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }} barCategoryGap="14%">
          <XAxis dataKey="i" hide />
          <YAxis hide domain={[0, max ?? 'dataMax']} />
          <Tooltip {...tooltipStyle} labelFormatter={(i) => labels?.[Number(i)] ?? ''} formatter={(v) => [`${v}${unit}`, name]} />
          <Bar dataKey="v" radius={[5, 5, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.i} fill={colour(d.i)} />
            ))}
          </Bar>
          {refX != null && (
            <ReferenceLine x={refIdx} stroke={INK} strokeWidth={2.5} strokeDasharray="6 5" />
          )}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}
