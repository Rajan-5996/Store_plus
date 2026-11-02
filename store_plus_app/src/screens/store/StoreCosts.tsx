import DonutChart from '../../components/charts/DonutChart'
import FunnelBars from '../../components/charts/FunnelBars'
import Box from '../../components/ui/Box'
import { rupee, rupeeShort } from '../../lib/format'
import type { StoreDetail } from '../../types/store'

export default function StoreCosts({ d }: { d: StoreDetail }) {
  const f = d.funnel
  return (
    <div className="grid g2 mt">
      <Box title="Where the operating cost goes (per day)">
        <DonutChart
          slices={d.costs.map((c) => ({ name: c.label, value: c.perDay }))}
          centre={rupeeShort(d.kpis.opexDay)}
          caption="a day"
          format={rupee}
        />
      </Box>
      <Box title="From app visit to order">
        <FunnelBars
          steps={[
            { name: 'App sessions', value: f.sessions },
            { name: 'Added to cart', value: f.addToCart },
            { name: 'Reached checkout', value: f.checkout },
            { name: 'Orders placed', value: f.orders },
          ]}
        />
      </Box>
    </div>
  )
}
