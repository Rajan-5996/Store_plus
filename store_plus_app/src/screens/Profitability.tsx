import { RiCheckboxCircleLine, RiFundsLine, RiMoneyRupeeCircleLine, RiPieChart2Line } from '@remixicon/react'
import Box from '../components/ui/Box'
import KeyValue from '../components/ui/KeyValue'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import { fmt, pct, rupee, rupeeShort } from '../lib/format'
import type { ProfitabilityData } from '../types/api'

const decisions = [
  ['Increase throughput', 'Estimate additional contribution after incremental staffing and fulfilment costs.'],
  ['Reduce controllable costs', 'Compare shift plans, rent, utilities and process cost against matched peers.'],
  ['Evaluate store action', 'Compare improve, maintain, relocate or exit scenarios using payback and risk.'],
]

function ProfitabilityBody({ d }: { d: ProfitabilityData }) {
  const { kpis, focusStore: s } = d
  return (
    <>
      <KpiGrid
        icons={[RiCheckboxCircleLine, RiFundsLine, RiMoneyRupeeCircleLine, RiPieChart2Line]}
        items={[
          { label: 'Stores above break-even', value: `${kpis.aboveBreakEven} / ${kpis.totalStores}` },
          { label: 'Network daily loss', value: rupeeShort(Math.abs(kpis.dailyNetworkLoss)), tone: 'loss' },
          { label: 'Average contribution/order', value: rupee(kpis.contributionPerOrder) },
          { label: 'Highest cost driver', value: kpis.topCostDrivers.join(' + '), valueStyle: { fontSize: 22 } },
        ]}
      />
      <div className="grid g2 mt">
        <Box title={s ? `Store ${s.code} ${s.area}: unit economics` : 'Unit economics'}>
          {s && (
            <KeyValue
              rows={[
                ['Orders/day', fmt(s.ordersDay)],
                ['Contribution/order', rupee(s.contributionPerOrder)],
                ['Daily contribution', rupee(s.dailyContribution)],
                ['Fixed operating cost/day', rupee(s.opexDay)],
                ['Break-even orders/day', s.breakEvenOrders ? fmt(s.breakEvenOrders) : '–'],
                ['Estimated daily P&L', rupee(s.pnlDay), s.pnlDay < 0 ? 'loss' : 'gain'],
              ]}
            />
          )}
        </Box>
        <Box title="Network cost breakdown">
          <ScoreBars rows={d.costBreakdown.map((c) => ({ label: c.label, pct: c.pct, value: pct(c.pct) }))} />
        </Box>
      </div>
      <Box className="mt" title="Decision support">
        <div className="module-grid">
          {decisions.map(([t, p]) => (
            <div key={t} className="module-card">
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </Box>
    </>
  )
}

export default function Profitability() {
  return (
    <section>
      <ScreenHeader
        title="Store profitability intelligence"
        sub="Explain store-level contribution and operating economics, identify the cost drivers and compare financially viable fixes."
      />
      <ScreenData name="profitability">{(d) => <ProfitabilityBody d={d} />}</ScreenData>
    </section>
  )
}
