import Box from '../components/ui/Box'
import { RiAlarmWarningLine, RiBox3Line, RiHourglass2Line, RiNotification3Line } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import Pill from '../components/ui/Pill'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import SimpleTable from '../components/ui/SimpleTable'

export default function Inventory() {
  return (
    <section>
      <ScreenHeader
        title="Inventory intelligence"
        sub="Reduce lost sales and avoidable inventory cost by connecting demand, availability, replenishment and ageing at store–SKU level."
      />
      <KpiGrid
        icons={[RiAlarmWarningLine, RiBox3Line, RiHourglass2Line, RiNotification3Line]}
        items={[
          { label: 'Stockout rate', value: '2.1%', tone: 'loss' },
          { label: 'At-risk inventory', value: '₹4.8L' },
          { label: 'Slow-moving SKUs', value: '186' },
          { label: 'Replenishment alerts', value: '42' },
        ]}
      />
      <div className="grid g2 mt">
        <Box title="Inventory health by category">
          <ScoreBars
            rows={[
              { label: 'Staples', pct: 88, value: '88%' },
              { label: 'Fruits & veg', pct: 63, value: '63%', hot: true },
              { label: 'Dairy', pct: 79, value: '79%' },
              { label: 'Personal care', pct: 92, value: '92%' },
            ]}
          />
        </Box>
        <Box title="Recommended inventory actions">
          <ol>
            <li>Forecast SKU demand by store and time window.</li>
            <li>Flag likely stockouts before peak demand.</li>
            <li>Recommend replenishment quantities with lead time and shelf-life constraints.</li>
            <li>Identify ageing stock for transfer, markdown or controlled liquidation.</li>
          </ol>
        </Box>
      </div>
      <Box className="mt scroll" title="SKU action queue">
        <SimpleTable
          head={['Store', 'SKU / product', 'On hand', 'Forecast demand', 'Risk', 'Suggested action']}
          rows={[
            ['#412', 'Milk 1L', '18', '34', <Pill variant="red">Stockout risk</Pill>, 'Replenish 20 units'],
            ['#118', 'Premium cereal', '74', '12', <Pill variant="red">Ageing risk</Pill>, 'Review transfer / markdown'],
            ['#233', 'Cooking oil 1L', '9', '27', <Pill>Low cover</Pill>, 'Check supplier lead time'],
          ]}
        />
      </Box>
    </section>
  )
}
