import { RiCheckboxCircleLine, RiArrowRightDownLine, RiMoneyRupeeCircleLine, RiPieChart2Line } from '@remixicon/react'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import KeyValue from '../components/ui/KeyValue'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import StoreLink from '../components/ui/StoreLink'
import { fmt, frac, pct, rupee, rupeeShort } from '../lib/format'
import type { ProfitabilityData } from '../types/api'

function ProfitabilityBody({ d }: { d: ProfitabilityData }) {
  const { kpis, focusStore: s } = d
  return (
    <>
      <KpiGrid
        icons={[RiCheckboxCircleLine, RiArrowRightDownLine, RiMoneyRupeeCircleLine, RiPieChart2Line]}
        items={[
          {
            label: 'Stores above break-even',
            value: (
              <>
                {kpis.aboveBreakEven}
                <span className="unit">of {kpis.totalStores}</span>
              </>
            ),
            delta: `${frac(kpis.aboveBreakEven / (kpis.totalStores || 1))} of the network`,
          },
          { label: 'Network daily loss', value: rupeeShort(Math.abs(kpis.dailyNetworkLoss)), tone: 'loss', delta: 'From loss-making stores only' },
          { label: 'Average contribution/order', value: rupee(kpis.contributionPerOrder), delta: 'Before fixed store costs' },
          { label: 'Highest cost driver', value: kpis.topCostDrivers.join(' + '), valueStyle: { fontSize: 22 }, delta: 'Largest fixed operating costs' },
        ]}
      />
      <AiInsights scope="profitability" title="Moves that close the profit gap" />
      <div className="grid g2 mt">
        <Box
          title={s ? `Unit economics: ${s.code} ${s.area}` : 'Unit economics'}
          sub="The store with the lowest daily profit in the current filter."
          actions={s && <StoreLink code={s.code}>Open store</StoreLink>}
        >
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
        <Box title="Network cost breakdown" sub="Share of fixed operating cost across all stores in the filter.">
          <ScoreBars rows={d.costBreakdown.map((c) => ({ label: c.label, pct: c.pct, value: pct(c.pct) }))} />
          <p className="mt-4 text-[12.5px] text-muted">
            {d.costBreakdown.map((c) => `${c.label} ${rupeeShort(c.perDay)}/day`).join(' · ')}
          </p>
        </Box>
      </div>
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
