import HBars from '../../components/charts/HBars'
import Box from '../../components/ui/Box'
import { fmt, pct } from '../../lib/format'
import type { StoreDetail } from '../../types/store'

export default function StoreStock({ d }: { d: StoreDetail }) {
  const { stock, mix } = d
  return (
    <div className="grid g2 mt">
      <Box title="Most missed products (units of demand lost to stock-outs)">
        {stock.topStockouts.length === 0 ? (
          <p>No stock-outs recorded in this period.</p>
        ) : (
          <HBars
            nameWidth={170}
            rows={stock.topStockouts.map((s) => ({
              name: s.sku,
              value: s.lost_units,
              label: `${fmt(s.lost_units)} units · ${s.oos_days} days out`,
              hot: s.oos_days >= 10,
            }))}
          />
        )}
      </Box>
      <Box title="Sales mix by category (orange = thin margin)">
        <HBars
          nameWidth={170}
          rows={mix.slice(0, 7).map((m) => ({
            name: m.category,
            value: m.share,
            label: `${pct(m.share * 100, 1)} · ${pct(m.marginPct, 1)} margin`,
            hot: m.marginPct < 8,
          }))}
        />
      </Box>
    </div>
  )
}
