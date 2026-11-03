import { Link } from 'react-router-dom'
import { RiStore2Line, RiCheckboxCircleLine, RiArrowRightDownLine, RiShoppingBag3Line } from '@remixicon/react'
import { fmt, frac, pct, rupee, rupeeShort } from '../lib/format'
import CandleChart from '../components/charts/CandleChart'
import HBars from '../components/charts/HBars'
import PnlBars from '../components/charts/PnlBars'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import StoreLink from '../components/ui/StoreLink'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenData from '../components/ui/ScreenData'
import SimpleTable from '../components/ui/SimpleTable'
import Trend from '../components/ui/Trend'
import { Axis, Legend, LegendItem } from '../components/ui/Legend'
import GreetingHero from './overview/GreetingHero'
import type { OverviewData } from '../types/api'

/** Where each cause of weakness is diagnosed in depth. */
const CAUSE_PAGE: Record<string, string> = {
  'Stock-out': '/inventory',
  'Weak demand': '/utilisation',
  'Picking queue': '/operations',
  Overlap: '/network',
}

function OverviewBody({ d }: { d: OverviewData }) {
  const { kpis, weekly } = d
  const lows = weekly.candles.map((c) => c.low)
  const highs = weekly.candles.map((c) => c.high)
  const lo = Math.floor((Math.min(...lows, weekly.breakEven ?? Infinity) - 50) / 50) * 50
  const hi = Math.ceil((Math.max(...highs, weekly.breakEven ?? 0) + 50) / 50) * 50
  const delta = kpis.ordersDeltaPct
  const n = weekly.candles.length
  const top = Math.max(...d.causes.map((c) => c.value))
  const causes = [...d.causes]
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ name: c.label, value: c.value, label: `${c.value} store${c.value === 1 ? '' : 's'}`, hot: c.value === top && top > 0 }))
  return (
    <>
      <KpiGrid
        icons={[RiStore2Line, RiCheckboxCircleLine, RiArrowRightDownLine, RiShoppingBag3Line]}
        items={[
          { label: 'Total stores', value: fmt(kpis.totalStores), delta: 'Active dark stores' },
          {
            label: 'Above break-even',
            value: (
              <>
                {kpis.aboveBreakEven}
                <span className="unit">
                  of {kpis.totalStores} · {frac(kpis.aboveBreakEven / (kpis.totalStores || 1))}
                </span>
              </>
            ),
            delta: <span className="text-loss">{kpis.losingStores} stores losing money</span>,
          },
          { label: 'Daily network loss', value: rupeeShort(kpis.dailyNetworkLoss), tone: 'loss', delta: 'From loss-making stores only' },
          {
            label: 'Avg orders/store/day',
            value: fmt(kpis.avgOrdersPerStoreDay),
            delta:
              delta == null ? undefined : (
                <>
                  <Trend change={delta} text={pct(Math.abs(delta), 1)} /> vs previous period
                </>
              ),
          },
        ]}
      />
      <AiInsights scope="overview" title="Where to act across the network" />
      <div className="grid g21 mt">
        <Box title="Median orders per store, weekly" sub="Each candle is one week of the median store's daily orders, against the orders a store needs to break even.">
          <CandleChart candles={weekly.candles} h={230} refY={weekly.breakEven ?? undefined} min={lo} max={hi} />
          <Axis labels={[`Week 1`, `Week ${Math.ceil(n / 3)}`, `Week ${Math.ceil((2 * n) / 3)}`, `Week ${n}`]} />
          <Legend>
            <LegendItem color="#1F6FEB">Week closed higher</LegendItem>
            <LegendItem color="#FF5200">Week closed lower</LegendItem>
            <LegendItem kind="dash">Median break-even (~{fmt(weekly.breakEven ?? 0)})</LegendItem>
          </Legend>
        </Box>
        <Box
          title="Why stores are losing money"
          sub="Each losing store is labelled with the factor furthest from the network median."
          hint="For every loss-making store, stock-outs, busy-mode losses, delivery-area overlap and order volume are compared with the network median; the factor most out of line becomes its cause."
        >
          <HBars rows={causes} nameWidth={104} labelWidth={72} />
        </Box>
      </div>
      <div className="grid g2 mt">
        <Box title="Daily loss of loss-making stores" sub="Combined profit and loss of the stores below break-even, last 30 days of data.">
          {d.lossTrend.length > 0 && <PnlBars dates={d.lossTrend.map((p) => p.date)} values={d.lossTrend.map((p) => p.pnl)} h={260} />}
        </Box>
        <Box title="Top 5 losing stores" sub="Select a store for its full breakdown, or a cause to open the page that diagnoses it.">
          <div className="scroll">
            <SimpleTable
              head={['Store', { t: 'Loss/day', r: true }, 'Likely cause']}
              rows={d.topLosers.map((s) => [
                <>
                  <StoreLink code={s.id} /> {s.area}
                </>,
                { v: rupee(s.lossPerDay), r: true, cls: 'loss num' },
                CAUSE_PAGE[s.cause] ? (
                  <Link key="c" to={CAUSE_PAGE[s.cause]} className="pill high no-underline hover:opacity-80">
                    {s.cause}
                  </Link>
                ) : (
                  s.cause
                ),
              ])}
            />
          </div>
        </Box>
      </div>
    </>
  )
}

export default function Overview() {
  return (
    <section>
      <GreetingHero />
      <ScreenData name="overview">{(d) => <OverviewBody d={d} />}</ScreenData>
    </section>
  )
}
