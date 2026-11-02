import { fmt, rupee } from '@/lib/format'
import type { StoreDetail } from '@/types/store'

interface Stat {
  label: string
  value: string
  note?: string
  tone?: 'loss' | 'gain'
  cls: string
}

/** Four numbers that matter most for a store, as small KPI cards. */
export default function StoreStats({ d }: { d: StoreDetail }) {
  const { kpis: k, ops } = d
  const gap = k.gapOrders
  const lost = ops.lostOrdersDay ?? 0
  const change = k.ordersDeltaPct
  const stats: Stat[] = [
    { label: 'Orders per day', value: fmt(k.ordersDay), cls: 'kpi-c1', note: change == null ? undefined : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% vs before` },
    { label: 'Profit / loss a day', value: rupee(k.pnlDay), cls: 'kpi-c6', tone: k.pnlDay < 0 ? 'loss' : 'gain', note: `Break-even needs ${k.breakEvenOrders ? fmt(k.breakEvenOrders) : '–'} orders` },
    { label: 'Gap to break-even', value: gap == null ? '–' : gap > 0 ? `${fmt(gap)} short` : `${fmt(-gap)} above`, cls: 'kpi-c4', note: 'orders per day' },
    { label: 'Lost at busy hours', value: fmt(lost), cls: 'kpi-c3', tone: lost >= 3 ? 'loss' : undefined, note: 'orders per day' },
  ]
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div key={s.label} className={`box kpi kpi-c ${s.cls} rec-kcard`}>
          <div className="label">{s.label}</div>
          <div className={`val ${s.tone ?? ''}`} style={{ fontSize: 21 }}>
            {s.value}
          </div>
          {s.note && <div className="delta !mt-0.5 !text-[12px]">{s.note}</div>}
        </div>
      ))}
    </div>
  )
}
