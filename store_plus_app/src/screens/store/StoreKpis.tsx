import { RiFundsLine, RiPercentLine, RiScalesLine, RiShoppingBag3Line } from '@remixicon/react'
import KpiGrid from '../../components/ui/KpiGrid'
import Trend from '../../components/ui/Trend'
import { fmt, frac, rupeeShort } from '../../lib/format'
import type { StoreDetail } from '../../types/store'

const vsBefore = (n: number | null, text: (n: number) => string) =>
  n == null ? undefined : (
    <>
      <Trend change={n} text={text(Math.abs(n))} /> vs previous period
    </>
  )

/** Four headline numbers; everything else on the page is a chart. */
export default function StoreKpis({ d }: { d: StoreDetail }) {
  const { kpis: k, funnel } = d
  const gap = k.gapOrders
  return (
    <KpiGrid
      icons={[RiShoppingBag3Line, RiFundsLine, RiScalesLine, RiPercentLine]}
      items={[
        { label: 'Orders per day', value: fmt(k.ordersDay), delta: vsBefore(k.ordersDeltaPct, (n) => `${n.toFixed(1)}%`) },
        {
          label: 'Profit / loss per day',
          value: rupeeShort(k.pnlDay),
          tone: k.pnlDay < 0 ? 'loss' : 'gain',
          delta: vsBefore(k.pnlDeltaDay, (n) => `${rupeeShort(n)}/day`),
        },
        {
          label: 'Gap to break-even',
          value: gap == null ? '–' : gap > 0 ? `${fmt(gap)} short` : `${fmt(-gap)} above`,
          tone: gap != null && gap > 0 ? 'loss' : undefined,
          delta: k.breakEvenOrders ? `Break-even is ${fmt(k.breakEvenOrders)} orders a day` : 'No positive contribution per order',
        },
        { label: 'Visit-to-order conversion', value: funnel.conversion == null ? '–' : frac(funnel.conversion, 1), delta: 'App sessions that became orders' },
      ]}
    />
  )
}
