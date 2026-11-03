import type { CSSProperties } from 'react'
import { RiAlarmWarningLine, RiBox3Line, RiHourglass2Line, RiNotification3Line } from '@remixicon/react'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import StoreLink from '../components/ui/StoreLink'
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
          { label: 'Stockout rate', value: frac(d.kpis.stockoutRate, 1), tone: 'loss', delta: 'Store–product days with a stock-out' },
          { label: 'At-risk inventory', value: rupeeShort(d.kpis.atRiskValue), delta: 'Perishables likely to expire' },
          { label: 'Slow-moving SKUs', value: fmt(d.kpis.slowSkus), delta: 'More than 7 days of stock' },
          { label: 'Replenishment alerts', value: fmt(d.kpis.replenishmentAlerts), delta: 'Below half of forecast demand' },
        ]}
      />
      <AiInsights scope="inventory" title="Inventory actions to protect sales and cut waste" />
      <Box className="mt" title="Inventory health by category" sub="Share of store–product days in stock, weakest categories first. Orange is below 95%." hint="1 − (store–product days with any out-of-stock minutes ÷ all store–product days), by top-level category.">
        <div className="bars-2" style={{ '--rows': Math.ceil(cats.length / 2) } as CSSProperties}>
          <ScoreBars rows={cats.map((c) => ({ label: c.label, pct: c.pct, value: pct(c.pct, 1), hot: c.pct < 95 }))} />
        </div>
      </Box>
      <Box className="mt scroll" title="SKU action queue" sub="Products to replenish before they run out, and ageing perishables to move or mark down.">
        <SimpleTable
          head={['Store', 'SKU / product', { t: 'On hand', r: true }, { t: 'Forecast demand', r: true }, 'Risk', 'Suggested action']}
          rows={d.queue.map((q) => [
            <StoreLink key="s" code={q.code} />,
            q.sku,
            { v: fmt(q.onHand), r: true, cls: `num ${q.onHand === 0 ? 'loss' : ''}` },
            { v: fmt(q.forecast), r: true },
            <Pill key="r" variant={q.risk.startsWith('Stockout') ? 'red' : 'warn'}>{q.risk}</Pill>,
            <b key="a">{q.action}</b>,
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
