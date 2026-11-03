import AiInsights from '../../components/insights/AiInsights'
import Box from '../../components/ui/Box'
import OrdersTrend from '../../components/charts/OrdersTrend'
import { Legend, LegendItem } from '../../components/ui/Legend'
import type { StoreDetail } from '../../types/store'

/** The agent's recommended actions for this store, then the main picture: orders against break-even. */
export default function StoreHero({ d, code }: { d: StoreDetail; code: string }) {
  return (
    <>
      <AiInsights scope={`store:${code}`} title="Actions for this store" />
      <Box className="mt" title="Orders per day against break-even" sub="Daily delivered orders and their 7-day average, against the orders this store needs to break even.">
        <OrdersTrend dates={d.series.dates} orders={d.series.orders} breakEven={d.kpis.breakEvenOrders} h={310} />
        <Legend>
          <LegendItem color="#FF5200">Orders each day</LegendItem>
          <LegendItem color="#1F6FEB">7-day average</LegendItem>
          <LegendItem kind="dash">Break-even</LegendItem>
        </Legend>
      </Box>
    </>
  )
}
