import { useAppSelector } from '../app/hooks'
import { selectTopLosers, dailyPnl } from '../features/stores/selectors'
import { rupee } from '../lib/format'
import { candles, wobble } from '../lib/series'
import CandleChart from '../components/charts/CandleChart'
import RadarTrend from '../components/charts/RadarTrend'
import Box from '../components/ui/Box'
import { RiStore2Line, RiCheckboxCircleLine, RiFundsLine, RiShoppingBag3Line } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import { Axis, Legend, LegendItem } from '../components/ui/Legend'
import GreetingHero from './overview/GreetingHero'
import AreaChart from '../components/charts/AreaChart'
import SimpleTable from '../components/ui/SimpleTable'


const causes = [
  { label: 'Stock-out', value: 12 },
  { label: 'Weak demand', value: 10 },
  { label: 'Picking queue', value: 9 },
  { label: 'Overlap', value: 6 },
]

const lossTrend = wobble(45, 470, 18, -2, 3)
const weekly = candles(12, 610, 56, 9, 2)

export default function Overview() {
  const top5 = useAppSelector(selectTopLosers)
  return (
    <section>
      <GreetingHero />
      <KpiGrid
        icons={[RiStore2Line, RiCheckboxCircleLine, RiFundsLine, RiShoppingBag3Line]}
        items={[
          { label: "Total stores", value: '50', delta: 'Active dark stores' },
          { label: "Above break-even", value: <>13 <span style={{ fontSize: 18, color: 'var(--muted)' }}>(26%)</span></>, delta: '37 stores losing money' },
          { label: "Daily network loss", value: '–₹3.8L', tone: 'loss', delta: 'From loss-making stores only' },
          { label: "Avg orders/store/day", value: '1,034', delta: '▲ 2% vs last month' },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Median orders per store, weekly">
          <CandleChart candles={weekly} h={230} refY={760} min={400} max={900} />
          <Axis labels={['Week 1', 'Week 4', 'Week 8', 'Week 12']} />
          <Legend>
            <LegendItem color="#1F6FEB">Week closed higher</LegendItem>
            <LegendItem color="#FF5200">Week closed lower</LegendItem>
            <LegendItem kind="dash">Typical break-even (~760)</LegendItem>
          </Legend>
        </Box>
        <Box title="Weak stores by cause">
          <AreaChart rows={causes} />
        </Box>
      </div>
      <div className="grid g2 mt">
        <Box title="Daily network loss, last 30 days">
          <RadarTrend values={lossTrend.slice(-30)} h={340} min={300} max={520} />
        </Box>
        <Box title="Top 5 losing stores">
          <div className="scroll">
            <SimpleTable
              head={['Store', { t: 'Loss/day', r: true }, 'Cause']}
              rows={top5.map((s) => [
                <><b>{s.id}</b> {s.area}</>,
                { v: rupee(dailyPnl(s.orders, s.breakEven)), r: true, cls: 'loss' },
                s.cause,
              ])}
            />
          </div>
        </Box>
      </div>
    </section>
  )
}
