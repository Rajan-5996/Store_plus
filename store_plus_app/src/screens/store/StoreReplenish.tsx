import { RiLoader4Line, RiTimeLine, RiTruckLine, RiFlashlightLine } from '@remixicon/react'
import { useState } from 'react'
import { useReplenishment } from '@/hooks/useReplenishment'
import StockoutTimeline from '../../components/charts/StockoutTimeline'
import Box from '../../components/ui/Box'
import KpiGrid from '../../components/ui/KpiGrid'
import { Legend, LegendItem } from '../../components/ui/Legend'
import type { ReplenishItem } from '../../types/store'

const hm = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`

/** The one plain sentence a store manager needs: when, how much, and why. */
export function replenishSummary(it: ReplenishItem): string {
  if (!it.plan || !it.runsOutAt) return 'This product stays in stock through the whole day.'
  return (
    `Add ${it.plan.extraUnits} units to the ${it.plan.arrives} delivery. Without it the shelf runs empty around ${it.runsOutAt}, ` +
    `just as the ${it.peak.fromLabel} to ${it.peak.toLabel} rush starts (${it.peak.sharePct}% of the day's sales).`
  )
}

export default function StoreReplenish({ code }: { code: string }) {
  const entry = useReplenishment(code)
  const [pick, setPick] = useState(0)
  const items = entry?.data?.items ?? []
  const it = items[Math.min(pick, items.length - 1)]

  if (!it) {
    return (
      <Box className="mt" title="When to replenish">
        {entry?.status === 'error' ? (
          <p className="text-brand">{entry.error}</p>
        ) : entry?.data ? (
          <p>No product is running out at this store in this period.</p>
        ) : (
          <p className="flex items-center gap-2 text-muted">
            <RiLoader4Line className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Working out delivery times…
          </p>
        )}
      </Box>
    )
  }
  return (
    <Box className="mt" title="When to replenish: stock against demand, hour by hour">
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((x, i) => (
          <button
            key={x.sku}
            type="button"
            className="chip"
            aria-pressed={i === pick}
            style={i === pick ? { background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'var(--brand)' } : undefined}
            onClick={() => setPick(i)}
          >
            {x.sku}
          </button>
        ))}
      </div>
      <KpiGrid
        cols={3}
        icons={[RiTimeLine, RiTruckLine, RiFlashlightLine]}
        items={[
          { label: 'Shelf runs empty around', value: it.runsOutAt ?? 'Never', tone: it.runsOutAt ? 'loss' : undefined, delta: it.measuredOutMinutes ? `Out ~${hm(it.measuredOutMinutes)} on ${it.outDays} of ${it.days} days` : undefined },
          { label: 'Replenish by', value: it.plan ? it.plan.arrives : '–', delta: it.plan ? `+${it.plan.extraUnits} units on the ${it.plan.slot} delivery` : undefined },
          { label: 'Demand peak', value: `${it.peak.fromLabel} to ${it.peak.toLabel}`, delta: `${it.peak.sharePct}% of the day's sales happen here` },
        ]}
      />
      <div className="mt-3">
        <StockoutTimeline curve={it.curve} peak={it.peak} plan={it.plan} />
        <Legend>
          <LegendItem color="#FF5200">What customers want each hour</LegendItem>
          <LegendItem color="#1F6FEB">Stock left today</LegendItem>
          <LegendItem color="#16A34A">Stock left with the extra delivery</LegendItem>
          <LegendItem kind="dash">Delivery</LegendItem>
          <LegendItem color="#16A34A">Extra delivery to add</LegendItem>
        </Legend>
      </div>
      <p className="mt-2 text-[14px] font-semibold">{replenishSummary(it)}</p>
      {it.plan && (
        <p className="mt-1 text-[13px] text-muted">
          With it, about {Math.round(it.unmetDay - it.plan.unmetAfter)} units a day of sales are saved. The delivery slots are 06:00, 15:00 and 18:00.
        </p>
      )}
      {it.events.map((e) => (
        <p key={e.label} className="mt-1 text-[13px] text-muted">
          <b className="text-ink">{e.label}</b> ({e.days} days): it sells {e.upliftPct}% more, about {e.demandDay} units a day
          {e.extraUnits ? `, so add ${e.extraUnits} units instead` : ''}.
        </p>
      ))}
    </Box>
  )
}
