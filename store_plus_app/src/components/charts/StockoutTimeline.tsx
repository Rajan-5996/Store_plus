import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReplenishPoint } from '@/types/store'
import { num1 } from '../../lib/format'
import { gridStroke, tick } from './axis'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

const GREEN = '#16A34A'
const NAMES: Record<string, string> = {
  demand: 'Customers want',
  stock: 'Stock left today',
  stockAfter: 'Stock left with the extra delivery',
}

/**
 * A typical day for one product: bars are what customers want each hour, the blue area is the stock left on the shelf,
 * the red band is the time it is empty, dashed lines mark deliveries, and the green line is the shelf with the extra delivery.
 */
interface Props {
  curve: ReplenishPoint[]
  peak: { fromLabel: string; toLabel: string }
  /** The recommended extra delivery: its slot ("18:00") and size. */
  plan?: { slot: string; extraUnits: number } | null
  h?: number
}

export default function StockoutTimeline({ curve, peak, plan, h = 300 }: Props) {
  const added = plan ? curve.find((p) => p.hour === parseInt(plan.slot, 10)) : undefined
  const empty = curve.filter((p) => p.stock <= 0.05 && p.demand > 0)
  const peakStart = curve.find((p) => p.label === peak.fromLabel)
  const peakEnd = curve[Math.min(curve.length - 1, curve.findIndex((p) => p.label === peak.toLabel) - 1)]
  return (
    <div style={{ height: h }} role="img" aria-label="Stock against demand through the day">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={curve} margin={{ top: 22, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.32} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval={1} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={38} />
          <Tooltip {...tooltipStyle} formatter={(v, n) => [num1(Number(v)), NAMES[String(n)] ?? String(n)]} />
          {peakStart && peakEnd && (
            <ReferenceArea x1={peakStart.label} x2={peakEnd.label} fill={ORANGE} fillOpacity={0.1} label={{ value: 'Demand peak', position: 'insideTop', fill: ORANGE, fontSize: 11, fontWeight: 700 }} />
          )}
          {empty.length > 0 && (
            <ReferenceArea x1={empty[0].label} x2={empty[empty.length - 1].label} fill="#DC2626" fillOpacity={0.14} label={{ value: 'Shelf empty', position: 'insideBottom', fill: '#B91C1C', fontSize: 11, fontWeight: 700 }} />
          )}
          {curve.filter((p) => p.delivery > 0 && p.hour !== (plan ? parseInt(plan.slot, 10) : -1)).map((p) => (
            <ReferenceLine key={p.label} x={p.label} stroke={INK} strokeDasharray="4 4" label={{ value: `+${p.delivery}`, position: 'top', fill: INK, fontSize: 11, fontWeight: 700 }} />
          ))}
          {added && plan && (
            <ReferenceLine x={added.label} stroke={GREEN} strokeWidth={2.5} label={{ value: `+${plan.extraUnits} to add`, position: 'insideTopLeft', fill: GREEN, fontSize: 11, fontWeight: 800 }} />
          )}
          <Bar dataKey="demand" fill={ORANGE} fillOpacity={0.55} radius={[3, 3, 0, 0]} barSize={14} isAnimationActive={false} />
          <Area dataKey="stock" stroke={BLUE} strokeWidth={2.5} fill="url(#stockFill)" isAnimationActive={false} />
          <Line dataKey="stockAfter" stroke={GREEN} strokeWidth={3} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
