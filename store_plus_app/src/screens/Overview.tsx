import { RiStore2Line, RiCheckboxCircleLine, RiFundsLine, RiShoppingBag3Line } from '@remixicon/react'
import { fmt, frac, pct, rupee, rupeeShort } from '../lib/format'
import CandleChart from '../components/charts/CandleChart'
import RadarTrend from '../components/charts/RadarTrend'
import AreaChart from '../components/charts/AreaChart'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenData from '../components/ui/ScreenData'
import SimpleTable from '../components/ui/SimpleTable'
import { Axis, Legend, LegendItem } from '../components/ui/Legend'
import GreetingHero from './overview/GreetingHero'
import type { OverviewData } from '../types/api'

const muted = { fontSize: 18, color: 'var(--muted)' }

function OverviewBody({ d }: { d: OverviewData }) {
  const { kpis, weekly } = d
  const lows = weekly.candles.map((c) => c.low)
  const highs = weekly.candles.map((c) => c.high)
  const lo = Math.floor((Math.min(...lows, weekly.breakEven ?? Infinity) - 50) / 50) * 50
  const hi = Math.ceil((Math.max(...highs, weekly.breakEven ?? 0) + 50) / 50) * 50
  const loss = d.lossTrend.map((p) => Math.max(0, -p.pnl) / 1000)
  const delta = kpis.ordersDeltaPct
  const n = weekly.candles.length
  return (
    <>
      <KpiGrid
        icons={[RiStore2Line, RiCheckboxCircleLine, RiFundsLine, RiShoppingBag3Line]}
        items={[
          { label: 'Total stores', value: fmt(kpis.totalStores), delta: 'Active dark stores' },
          {
            label: 'Above break-even',
            value: (
              <>
                {kpis.aboveBreakEven} <span style={muted}>({frac(kpis.aboveBreakEven / (kpis.totalStores || 1))})</span>
              </>
            ),
            delta: `${kpis.losingStores} stores losing money`,
          },
          { label: 'Daily network loss', value: rupeeShort(kpis.dailyNetworkLoss), tone: 'loss', delta: 'From loss-making stores only' },
          {
            label: 'Avg orders/store/day',
            value: fmt(kpis.avgOrdersPerStoreDay),
            delta: delta == null ? undefined : `${delta >= 0 ? '▲' : '▼'} ${pct(Math.abs(delta), 1)} vs previous period`,
          },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Median orders per store, weekly">
          <CandleChart candles={weekly.candles} h={230} refY={weekly.breakEven ?? undefined} min={lo} max={hi} />
          <Axis labels={[`Week 1`, `Week ${Math.ceil(n / 3)}`, `Week ${Math.ceil((2 * n) / 3)}`, `Week ${n}`]} />
          <Legend>
            <LegendItem color="#1F6FEB">Week closed higher</LegendItem>
            <LegendItem color="#FF5200">Week closed lower</LegendItem>
            <LegendItem kind="dash">Median break-even (~{fmt(weekly.breakEven ?? 0)})</LegendItem>
          </Legend>
        </Box>
        <Box title="Weak stores by cause">
          <AreaChart rows={d.causes} />
        </Box>
      </div>
      <div className="grid g2 mt">
        <Box title="Daily network loss, last 30 days">
          {loss.length > 0 && <RadarTrend values={loss} h={340} min={Math.max(0, Math.min(...loss) - 40)} max={Math.max(...loss) + 20} />}
        </Box>
        <Box title="Top 5 losing stores">
          <div className="scroll">
            <SimpleTable
              head={['Store', { t: 'Loss/day', r: true }, 'Cause']}
              rows={d.topLosers.map((s) => [
                <>
                  <b>{s.id}</b> {s.area}
                </>,
                { v: rupee(s.lossPerDay), r: true, cls: 'loss' },
                s.cause,
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
