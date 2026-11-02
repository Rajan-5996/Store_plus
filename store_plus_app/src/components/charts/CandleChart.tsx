import { Bar, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt } from '../../lib/format'
import { BLUE, INK, ORANGE, tooltipStyle } from './palette'

export interface Candle {
  open: number
  close: number
  low: number
  high: number
}

interface Props {
  candles: Candle[]
  h?: number
  /** Horizontal reference line (e.g. break-even). */
  refY?: number
  min?: number
  max?: number
}

interface ShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: Candle
}

/** Draws one candlestick: wick from low to high, body from open to close. Blue = closed higher, orange = lower. */
function CandleShape({ x = 0, y = 0, width = 0, height = 0, payload }: ShapeProps) {
  if (!payload) return null
  const { open, close, low, high } = payload
  const span = high - low || 1
  const py = (v: number) => y + ((high - v) / span) * height
  const up = close >= open
  const colour = up ? BLUE : ORANGE
  const cx = x + width / 2
  const bodyTop = py(Math.max(open, close))
  const bodyH = Math.max(3, Math.abs(py(open) - py(close)))
  return (
    <g>
      <line x1={cx} x2={cx} y1={py(high)} y2={py(low)} stroke={colour} strokeWidth={2} strokeLinecap="round" />
      <rect x={x + width * 0.18} y={bodyTop} width={width * 0.64} height={bodyH} rx={2} fill={colour} />
    </g>
  )
}

interface TipProps {
  active?: boolean
  payload?: { payload: Candle & { i: number } }[]
}

/** Hover panel: week title, then Open / High / Low / Close one below the other. */
function CandleTip({ active, payload }: TipProps) {
  const c = payload?.[0]?.payload
  if (!active || !c) return null
  const rows: [string, number][] = [['Open', c.open], ['High', c.high], ['Low', c.low], ['Close', c.close]]
  const up = c.close >= c.open
  return (
    <div className="min-w-36 rounded-[10px] border border-line-soft bg-surface px-3 py-2.5 text-xs shadow-raised">
      <div className="mb-1.5 text-[13px] font-extrabold">Week {c.i + 1}</div>
      <div className="flex flex-col gap-1">
        {rows.map(([label, v]) => (
          <div key={label} className="flex items-center justify-between gap-6">
            <span className="text-muted">{label}</span>
            <b>{fmt(v)}</b>
          </div>
        ))}
      </div>
      <div className="mt-1.5 border-t border-line-soft pt-1.5 font-bold" style={{ color: up ? BLUE : ORANGE }}>
        {up ? 'Closed higher' : 'Closed lower'}
      </div>
    </div>
  )
}

/** Candlestick chart (open / high / low / close per period) built on a recharts range bar. */
export default function CandleChart({ candles, h = 150, refY, min, max }: Props) {
  const data = candles.map((c, i) => ({ i, ...c, range: [c.low, c.high] as [number, number] }))
  return (
    <div style={{ height: h }} role="img" aria-label="Candlestick chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis hide domain={[min ?? 'dataMin', max ?? 'dataMax']} />
          <Tooltip content={<CandleTip />} cursor={tooltipStyle.cursor} />
          <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} />
          {refY != null && <ReferenceLine y={refY} stroke={INK} strokeWidth={2} strokeDasharray="6 5" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
