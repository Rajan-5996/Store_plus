import PeerIndex, { type Index } from '../../components/charts/PeerIndex'
import WeekdayBars from '../../components/charts/WeekdayBars'
import Box from '../../components/ui/Box'
import type { StoreDetail } from '../../types/store'

const idx = (own: number, median: number | null): number | null => (median ? Math.round((100 * own) / median) : null)

export default function StoreCompare({ d }: { d: StoreDetail }) {
  const { kpis: k, peers: p } = d
  const rows: Index[] = [
    { metric: 'Orders per day', format: idx(k.ordersDay, p.format.ordersDay), network: idx(k.ordersDay, p.network.ordersDay) },
    { metric: 'Contribution per order', format: idx(k.cpo, p.format.cpo), network: idx(k.cpo, p.network.cpo) },
    { metric: 'Operating cost per day', format: idx(k.opexDay, p.format.opexDay), network: idx(k.opexDay, p.network.opexDay) },
  ]
  return (
    <div className="grid g2 mt">
      <Box title={`How it compares (100% = the median of ${p.format.name} stores / all stores)`}>
        <PeerIndex rows={rows} />
        <p className="mt-1 text-[12.5px] text-muted">
          <b className="text-[#1F6FEB]">Blue</b> is against the {p.format.name} median, <b className="text-brand">orange</b> against the network. Higher is better for
          orders and contribution, lower is better for cost.
        </p>
      </Box>
      <Box title="Which days sell most (average orders)">
        <WeekdayBars dates={d.series.dates} orders={d.series.orders} />
      </Box>
    </div>
  )
}
