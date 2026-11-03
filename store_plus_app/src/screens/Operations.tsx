import { RiTimeLine, RiTeamLine, RiPauseCircleLine, RiSpeedUpLine } from '@remixicon/react'
import LineChart from '../components/charts/LineChart'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import StoreLink from '../components/ui/StoreLink'
import KpiGrid from '../components/ui/KpiGrid'
import { Axis, Legend, LegendItem } from '../components/ui/Legend'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, hourLabel, num1 } from '../lib/format'
import type { OperationsData } from '../types/api'

function OperationsBody({ d }: { d: OperationsData }) {
  const { kpis, queueByHour: q } = d
  const lo = Math.max(0, Math.floor(Math.min(...q.values) - 0.5))
  const hi = Math.ceil(Math.max(...q.values) + 0.5)
  const tick = (i: number) => hourLabel(q.hours[Math.min(q.hours.length - 1, i)])
  const last = q.hours.length - 1
  return (
    <>
      <KpiGrid
        icons={[RiTimeLine, RiTeamLine, RiPauseCircleLine, RiSpeedUpLine]}
        items={[
          { label: 'Median pick time', value: <>{num1(kpis.medianPickMin)}<span className="unit">min</span></>, delta: 'Picking start to complete' },
          {
            label: 'Peak queue time',
            value: <>{kpis.peakQueueMin == null ? '–' : kpis.peakQueueMin.toFixed(2)}<span className="unit">min</span></>,
            tone: 'loss',
            delta: 'Wait before picking, busiest hour',
          },
          { label: 'Order pause time/day', value: <>{fmt(kpis.pauseMinDay ?? 0)}<span className="unit">min</span></>, delta: 'Per store, in busy mode' },
          { label: 'Orders per picker-hour', value: num1(kpis.ordersPerPickerHour), delta: 'Picking productivity' },
        ]}
      />
      <AiInsights scope="operations" title="Fixes for order throughput" />
      <Box className="mt" title="Time from order to picked, by hour" sub="Average minutes from order accepted to picking complete, 8 AM to 11 PM.">
        <LineChart
          series={[{ v: q.values, c: 'var(--ink)' }]}
          labels={q.hours.map(hourLabel)}
          name="Minutes"
          unit=" min"
          yAxis
          h={220}
          min={lo}
          max={hi}
          shade={q.peak}
        />
        <div className="pl-8">
          <Axis labels={[tick(0), tick(Math.round(last / 4)), tick(Math.round(last / 2)), tick(Math.round((3 * last) / 4)), tick(last)]} />
        </div>
        <Legend>
          <LegendItem color="#1F6FEB">Minutes to picked</LegendItem>
          <LegendItem color="color-mix(in srgb,#FF5200 25%,transparent)">Slowest hours</LegendItem>
        </Legend>
      </Box>
      <Box className="mt scroll" title="Operational intervention candidates" sub="Stores with the longest pick queues: what to check, what to try, and how to know it worked.">
        <SimpleTable
          head={['Store', 'Observed issue', 'Evidence needed', 'Potential intervention', 'Measure success by']}
          rows={d.candidates.map((c) => [<StoreLink key="s" code={c.code} />, <b key="i">{c.issue}</b>, c.evidence, c.intervention, c.measure])}
        />
      </Box>
    </>
  )
}

export default function Operations() {
  return (
    <section>
      <ScreenHeader
        title="Operational efficiency"
        sub="Find the process step that limits order throughput: picking, packing, staging, handover or staffing."
      />
      <ScreenData name="operations">{(d) => <OperationsBody d={d} />}</ScreenData>
    </section>
  )
}
