import Box from '../components/ui/Box'
import KeyValue from '../components/ui/KeyValue'
import { RiCheckboxCircleLine, RiFundsLine, RiMoneyRupeeCircleLine, RiPieChart2Line } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'

const decisions = [
  ['Increase throughput', 'Estimate additional contribution after incremental staffing and fulfilment costs.'],
  ['Reduce controllable costs', 'Compare shift plans, rent, utilities and process cost against matched peers.'],
  ['Evaluate store action', 'Compare improve, maintain, relocate or exit scenarios using payback and risk.'],
]

export default function Profitability() {
  return (
    <section>
      <ScreenHeader
        title="Store profitability intelligence"
        sub="Explain store-level contribution and operating economics, identify the cost drivers and compare financially viable fixes."
      />
      <KpiGrid
        icons={[RiCheckboxCircleLine, RiFundsLine, RiMoneyRupeeCircleLine, RiPieChart2Line]}
        items={[
          { label: 'Stores above break-even', value: '13 / 50' },
          { label: 'Network daily loss', value: '₹3.8L', tone: 'loss' },
          { label: 'Average contribution/order', value: '₹80' },
          { label: 'Highest cost driver', value: 'Staff + rent', valueStyle: { fontSize: 22 } },
        ]}
      />
      <div className="grid g2 mt">
        <Box title="Store #412 — unit economics">
          <KeyValue
            rows={[
              ['Orders/day', '610'],
              ['Contribution/order', '₹80'],
              ['Daily contribution', '₹48,800'],
              ['Fixed operating cost/day', '₹60,800'],
              ['Break-even orders/day', '760'],
              ['Estimated daily P&L', '−₹12,000', 'loss'],
            ]}
          />
        </Box>
        <Box title="Cost breakdown required">
          <ScoreBars
            rows={[
              { label: 'Rent', pct: 41, value: '41%' },
              { label: 'Staff', pct: 49, value: '49%' },
              { label: 'Utilities', pct: 10, value: '10%' },
            ]}
          />
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
    </section>
  )
}
