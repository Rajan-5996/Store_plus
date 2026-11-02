import { RiFundsLine, RiPercentLine, RiScalesLine, RiShoppingBag3Line } from '@remixicon/react'
import KpiGrid from '../../components/ui/KpiGrid'
import { fmt, frac, rupeeShort } from '../../lib/format'
import type { StoreDetail } from '../../types/store'

const change = (n: number | null) =>
  n == null ? undefined : `${n >= 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(1)}% vs previous period`

/** Four headline numbers; everything else on the page is a chart. */
export default function StoreKpis({ d }: { d: StoreDetail }) {
  const { kpis: k, funnel } = d
  const gap = k.gapOrders
  return (
    <KpiGrid
      icons={[RiShoppingBag3Line, RiFundsLine, RiScalesLine, RiPercentLine]}
      items={[
        { label: 'Orders per day', value: fmt(k.ordersDay), delta: change(k.ordersDeltaPct) },
        {
          label: 'Profit / loss per day',
          value: rupeeShort(k.pnlDay),
          tone: k.pnlDay < 0 ? 'loss' : undefined,
          delta:
            k.pnlDeltaDay == null
              ? undefined
              : `${k.pnlDeltaDay >= 0 ? '▲' : '▼'} ${rupeeShort(Math.abs(k.pnlDeltaDay))}/day vs previous period`,
        },
        {
          label: 'Gap to break-even',
          value: gap == null ? '–' : gap > 0 ? `${fmt(gap)} short` : `${fmt(-gap)} above`,
          delta: k.breakEvenOrders ? `Break-even is ${fmt(k.breakEvenOrders)} orders a day` : 'No positive contribution per order',
        },
        { label: 'Visit-to-order conversion', value: funnel.conversion == null ? '–' : frac(funnel.conversion, 1) },
      ]}
    />
  )
}
