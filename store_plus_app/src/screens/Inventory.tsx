import { RiAlarmWarningLine, RiBox3Line, RiHourglass2Line, RiNotification3Line } from '@remixicon/react'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import Pill from '../components/ui/Pill'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, frac, pct, rupeeShort } from '../lib/format'
import type { InventoryData } from '../types/api'

function InventoryBody({ d }: { d: InventoryData }) {
  // lowest availability first, so the categories that need attention lead
  const cats = [...d.categoryHealth].sort((a, b) => a.pct - b.pct).slice(0, 6)
  return (
    <>
      <KpiGrid
        icons={[RiAlarmWarningLine, RiBox3Line, RiHourglass2Line, RiNotification3Line]}
        items={[
          { label: 'Stockout rate', value: frac(d.kpis.stockoutRate, 1), tone: 'loss' },
          { label: 'At-risk inventory', value: rupeeShort(d.kpis.atRiskValue) },
          { label: 'Slow-moving SKUs', value: fmt(d.kpis.slowSkus) },
          { label: 'Replenishment alerts', value: fmt(d.kpis.replenishmentAlerts) },
        ]}
      />
      <div className="grid g2 mt">
        <Box title="Inventory health by category">
          <ScoreBars rows={cats.map((c) => ({ label: c.label, pct: c.pct, value: pct(c.pct, 1), hot: c.pct < 95 }))} />
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
          rows={d.queue.map((q) => [
            q.code,
            q.sku,
            fmt(q.onHand),
            fmt(q.forecast),
            <Pill variant="red">{q.risk}</Pill>,
            q.action,
          ])}
        />
      </Box>
    </>
  )
}

export default function Inventory() {
  return (
    <section>
      <ScreenHeader
        title="Inventory intelligence"
        sub="Reduce lost sales and avoidable inventory cost by connecting demand, availability, replenishment and ageing at store–SKU level."
      />
      <ScreenData name="inventory">{(d) => <InventoryBody d={d} />}</ScreenData>
    </section>
  )
}
