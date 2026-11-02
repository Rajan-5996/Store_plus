import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS, tooltipStyle } from './palette'

export interface Slice {
  name: string
  value: number
}

interface Props {
  slices: Slice[]
  /** Big figure in the middle and the caption under it. */
  centre: string
  caption: string
  format: (v: number) => string
  h?: number
}

/** Donut with a legend that lists each slice's value and share. */
export default function DonutChart({ slices, centre, caption, format, h = 210 }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative shrink-0" style={{ width: h, height: h }} role="img" aria-label={`${caption}: ${centre}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip {...tooltipStyle} formatter={(v, n) => [format(Number(v)), String(n)]} />
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="96%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {slices.map((s, i) => (
                <Cell key={s.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[22px] font-extrabold leading-tight">{centre}</div>
            <div className="text-[12px] font-semibold text-muted">{caption}</div>
          </div>
        </div>
      </div>
      <ul className="m-0 flex min-w-40 flex-1 list-none flex-col gap-2 !p-0">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center gap-2 text-[13px]">
            <i className="size-3 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 font-semibold">{s.name}</span>
            <b>{format(s.value)}</b>
            <span className="w-10 text-right text-muted">{Math.round((100 * s.value) / total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
