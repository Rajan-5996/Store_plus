import HourlyChart from '../../components/charts/HourlyChart'
import PnlBars from '../../components/charts/PnlBars'
import Box from '../../components/ui/Box'
import { Legend, LegendItem } from '../../components/ui/Legend'
import type { StoreDetail } from '../../types/store'

export default function StoreTrend({ d }: { d: StoreDetail }) {
  return (
    <div className="grid g2 mt">
      <Box title="Daily profit and loss">
        <PnlBars dates={d.series.dates} values={d.series.pnl} />
        <Legend>
          <LegendItem color="#1F6FEB">Made money</LegendItem>
          <LegendItem color="#FF5200">Lost money</LegendItem>
        </Legend>
      </Box>
      <Box title="Demand against capacity, hour by hour">
        <HourlyChart hours={d.hourly} />
        <Legend>
          <LegendItem color="#FF5200">Orders accepted</LegendItem>
          <LegendItem color="#1F6FEB">Staffed capacity</LegendItem>
          <LegendItem color="#1E293B">Orders lost</LegendItem>
        </Legend>
      </Box>
    </div>
  )
}
