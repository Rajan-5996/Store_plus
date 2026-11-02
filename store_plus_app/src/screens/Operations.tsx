import LineChart from '../components/charts/LineChart'
import Box from '../components/ui/Box'
import { RiTimeLine, RiTeamLine, RiPauseCircleLine, RiSpeedUpLine } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import { Axis } from '../components/ui/Legend'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'

const pickByHour = [4.1, 4.0, 4.2, 4.3, 4.4, 4.5, 4.8, 5.0, 5.4, 6.2, 7.8, 9.5, 9.1, 7.4, 5.6, 4.8]

export default function Operations() {
  return (
    <section>
      <ScreenHeader
        title="Operational efficiency"
        sub="Find the process step that limits order throughput: picking, packing, staging, handover or staffing."
      />
      <KpiGrid
        icons={[RiTimeLine, RiTeamLine, RiPauseCircleLine, RiSpeedUpLine]}
        items={[
          { label: 'Median pick time', value: '5.8 min' },
          { label: 'Peak queue time', value: '9.5 min', tone: 'loss' },
          { label: 'Order pause time/day', value: '85 min' },
          { label: 'Orders per picker-hour', value: '18' },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Picking time by hour">
          <LineChart series={[{ v: pickByHour, c: 'var(--ink)' }]} h={150} min={0} max={11} shade={[10, 13]} />
          <Axis labels={['8 AM', '12 PM', '4 PM', '8 PM', '12 AM']} />
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
          rows={[
            ['#412', 'Evening picking queue', 'Pick events, queue length, shift roster', 'Peak-hour picker or re-slotting', 'Orders/hour, pick time, pause minutes'],
            ['#233', 'Low throughput', 'Order funnel and staffing', 'Shift / process review', 'Throughput and cost/order'],
            ['#118', 'Replenishment interruptions', 'Receiving and shelf-fill timestamps', 'Change replenishment window', 'Availability and fulfilment time'],
          ]}
        />
      </Box>
    </section>
  )
}
