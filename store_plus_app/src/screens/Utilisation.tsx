import { RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line } from '@remixicon/react'
import BarChart from '../components/charts/BarChart'
import AgentActions from '../components/ui/AgentActions'
import Box from '../components/ui/Box'
import StoreLink from '../components/ui/StoreLink'
import KpiGrid from '../components/ui/KpiGrid'
import { Legend, LegendItem } from '../components/ui/Legend'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, frac } from '../lib/format'
import type { UtilisationData } from '../types/api'

const TARGET = 0.7 // utilisation below this means spare capacity (matches the backend threshold)

function UtilisationBody({ d }: { d: UtilisationData }) {
  const sorted = [...d.stores].sort((a, b) => a.utilisation - b.utilisation)
  const spare = sorted.filter((s) => s.utilisation < TARGET).length
  return (
    <>
      <KpiGrid
        icons={[RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line]}
        items={[
          { label: 'Average capacity utilisation', value: frac(d.kpis.avgUtilisation) },
          { label: 'Stores with spare capacity', value: fmt(d.kpis.spareCapacityStores) },
          { label: 'Peak-hour constrained stores', value: fmt(d.kpis.constrainedStores) },
          { label: 'Potential additional orders/day', value: fmt(d.kpis.potentialOrdersDay) },
        ]}
      />
      <div className="grid g21 mt fill-grid">
        <Box title="Capacity utilisation by store">
          <BarChart values={sorted.map((s) => Math.round(s.utilisation * 100))} h={150} max={100} refX={spare / (sorted.length || 1)} />
          <Legend>
            <LegendItem color="#FF5200">Spare capacity (below {TARGET * 100}%)</LegendItem>
            <LegendItem color="#1F6FEB">Well utilised</LegendItem>
            <LegendItem kind="dash">Target utilisation</LegendItem>
          </Legend>
        </Box>
        <AgentActions scope="utilisation" fill />
      </div>
      <Box className="mt scroll" title="Store utilisation opportunities">
        <SimpleTable
          head={['Store', 'Orders/day', 'Estimated capacity', 'Utilisation', 'Likely constraint', 'Next action']}
          rows={sorted.slice(0, 8).map((s) => [
            <>
              <StoreLink code={s.code} /> · {s.area}
            </>,
            fmt(s.ordersDay),
            fmt(s.capacityDay),
            frac(s.utilisation),
            s.constraint,
            s.action,
          ])}
        />
      </Box>
    </>
  )
}

export default function Utilisation() {
  return (
    <section>
      <ScreenHeader
        title="Store utilisation intelligence"
        sub="Understand how much of each store's available operating capacity is being used, when capacity is constrained, and where more orders can be absorbed."
      />
      <ScreenData name="utilisation">{(d) => <UtilisationBody d={d} />}</ScreenData>
    </section>
  )
}
