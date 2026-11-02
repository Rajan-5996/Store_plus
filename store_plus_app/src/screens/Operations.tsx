import { RiTimeLine, RiTeamLine, RiPauseCircleLine, RiSpeedUpLine } from '@remixicon/react'
import LineChart from '../components/charts/LineChart'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import { Axis } from '../components/ui/Legend'
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
          { label: 'Median pick time', value: `${num1(kpis.medianPickMin)} min` },
          { label: 'Peak queue time', value: `${kpis.peakQueueMin == null ? '–' : kpis.peakQueueMin.toFixed(2)} min`, tone: 'loss' },
          { label: 'Order pause time/day', value: `${fmt(kpis.pauseMinDay ?? 0)} min` },
          { label: 'Orders per picker-hour', value: num1(kpis.ordersPerPickerHour) },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Time to pick by hour (minutes)">
          <LineChart series={[{ v: q.values, c: 'var(--ink)' }]} h={150} min={lo} max={hi} shade={q.peak} />
          <Axis labels={[tick(0), tick(Math.round(last / 4)), tick(Math.round(last / 2)), tick(Math.round((3 * last) / 4)), tick(last)]} />
        </Box>
        <Box title="Potential bottleneck checks">
          <ul>
            <li>Orders arriving faster than pickers can process.</li>
            <li>Long walking paths or poor slotting.</li>
            <li>Packing / staging congestion after picking.</li>
            <li>Staffing mismatch between shifts and demand.</li>
          </ul>
          <div className="callout">
            Recommend a fix only after identifying the constrained process step and estimating its cost and expected
            throughput uplift.
          </div>
        </Box>
      </div>
      <Box className="mt scroll" title="Operational intervention candidates">
        <SimpleTable
          head={['Store', 'Observed issue', 'Evidence needed', 'Potential intervention', 'Measure success by']}
          rows={d.candidates.map((c) => [c.code, c.issue, c.evidence, c.intervention, c.measure])}
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
