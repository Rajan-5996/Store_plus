import AgentActions from '../../components/ui/AgentActions'
import Box from '../../components/ui/Box'
import OrdersTrend from '../../components/charts/OrdersTrend'
import { Legend, LegendItem } from '../../components/ui/Legend'
import type { StoreDetail } from '../../types/store'

/** The main picture (orders against break-even) next to the agent's recommended actions. */
export default function StoreHero({ d, code }: { d: StoreDetail; code: string }) {
  return (
    <div className="grid g21 mt fill-grid">
      <Box title="Orders per day against break-even">
        <OrdersTrend dates={d.series.dates} orders={d.series.orders} breakEven={d.kpis.breakEvenOrders} h={310} />
        <Legend>
          <LegendItem color="#FF5200">Orders each day</LegendItem>
          <LegendItem color="#1F6FEB">7-day average</LegendItem>
          <LegendItem kind="dash">Break-even</LegendItem>
        </Legend>
      </Box>
      <AgentActions scope={`store:${code}`} title="Recommended actions" fill />
    </div>
  )
}
