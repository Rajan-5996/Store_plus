import BarChart from '../components/charts/BarChart'
import Box from '../components/ui/Box'
import { RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import { Legend, LegendItem } from '../components/ui/Legend'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'

export default function Utilisation() {
  return (
    <section>
      <ScreenHeader
        title="Store utilisation intelligence"
        sub="Understand how much of each store's available operating capacity is being used, when capacity is constrained, and where more orders can be absorbed."
      />
      <KpiGrid
        icons={[RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line]}
        items={[
          { label: 'Average capacity utilisation', value: '40%' },
          { label: 'Stores with spare capacity', value: '28' },
          { label: 'Peak-hour constrained stores', value: '9' },
          { label: 'Potential additional orders/day', value: '6,400' },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Capacity vs actual orders by store">
          <BarChart values={[610, 545, 700, 520, 640, 480, 690, 610]} h={150} max={1600} refX={0.48} />
          <Legend>
            <LegendItem>Actual orders</LegendItem>
            <LegendItem kind="dash">Available capacity reference</LegendItem>
          </Legend>
        </Box>
        <Box title="Recommended actions">
          <ul>
            <li>Shift eligible demand to nearby stores with headroom.</li>
            <li>Review peak-hour staffing where throughput is constrained.</li>
            <li>Separate demand shortage from fulfilment-capacity shortage.</li>
          </ul>
          <div className="callout">
            Do not treat theoretical maximum capacity as achievable capacity. Calibrate it using actual operating
            hours, staffing, order mix and service-level constraints.
          </div>
        </Box>
      </div>
      <Box className="mt scroll" title="Store utilisation opportunities">
        <SimpleTable
          head={['Store', 'Orders/day', 'Estimated capacity', 'Utilisation', 'Likely constraint', 'Next action']}
          rows={[
            ['#412 · HSR', '610', '1,500', '41%', 'Peak picking queue', 'Review 7–9 PM throughput'],
            ['#233 · Kondapur', '545', '1,250', '44%', 'Demand coverage', 'Analyse catchment demand'],
            ['#118 · Andheri E', '700', '1,300', '54%', 'Stock availability', 'Check replenishment'],
          ]}
        />
      </Box>
    </section>
  )
}
