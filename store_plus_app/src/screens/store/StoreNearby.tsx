import Box from '../../components/ui/Box'
import SimpleTable from '../../components/ui/SimpleTable'
import StoreLink from '../../components/ui/StoreLink'
import { fmt, rupee } from '../../lib/format'
import type { StoreDetail } from '../../types/store'

export default function StoreNearby({ d }: { d: StoreDetail }) {
  return (
    <Box className="mt scroll" title="Nearest stores">
      {d.nearby.length === 0 ? (
        <p>No other store within 15 km, so there is no overlap to review.</p>
      ) : (
        <SimpleTable
          head={['Store', { t: 'Distance', r: true }, { t: 'Orders/day', r: true }, { t: 'P&L/day', r: true }]}
          rows={d.nearby.map((s) => [
            <>
              <StoreLink code={s.code} /> {s.area}
            </>,
            { v: `${s.km} km`, r: true },
            { v: fmt(s.ordersDay), r: true },
            { v: rupee(s.pnlDay), r: true, cls: s.pnlDay < 0 ? 'loss' : 'gain' },
          ])}
        />
      )}
    </Box>
  )
}
