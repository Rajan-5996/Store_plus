import { fmt, frac } from '../../lib/format'

const SHADES = ['#FF5200', '#FF7A33', '#4C8DF0', '#1F6FEB']

export interface Step {
  name: string
  value: number
}

/** A centred funnel: each step's bar is as wide as its share of the first step, with the drop-off between steps. */
export default function FunnelBars({ steps }: { steps: Step[] }) {
  const top = steps[0]?.value || 1
  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label="Customer funnel">
      {steps.map((s, i) => {
        const w = Math.max(14, (100 * s.value) / top)
        const prev = i > 0 ? steps[i - 1].value : null
        return (
          <div key={s.name} className="w-full">
            {prev != null && prev > 0 && (
              <div className="mb-1 text-center text-[11.5px] font-semibold text-muted">▼ {frac(s.value / prev, 0)} continue</div>
            )}
            <div
              className="mx-auto flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold text-brand-ink"
              style={{ width: `${w}%`, minWidth: 200, background: SHADES[Math.min(i, SHADES.length - 1)] }}
            >
              <span>{s.name}</span>
              <span>{fmt(s.value)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
