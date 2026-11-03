import { RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line } from '@remixicon/react'
import BarChart from '../components/charts/BarChart'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import StoreLink from '../components/ui/StoreLink'
import KpiGrid from '../components/ui/KpiGrid'
import { Legend, LegendItem } from '../components/ui/Legend'
import Pill, { type PillVariant } from '../components/ui/Pill'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, frac } from '../lib/format'
import type { UtilisationData } from '../types/api'

const TARGET = 0.7 // utilisation below this means spare capacity (matches the backend threshold)

const CONSTRAINT: Record<string, PillVariant> = {
  'Peak picking queue': 'red',
  'Demand coverage': 'warn',
  'Stock availability': 'high',
  Balanced: 'green',
}

function UtilisationBody({ d }: { d: UtilisationData }) {
  const sorted = [...d.stores].sort((a, b) => a.utilisation - b.utilisation)
  const spare = sorted.filter((s) => s.utilisation < TARGET).length
  return (
    <>
      <KpiGrid
        icons={[RiDashboard3Line, RiBuilding2Line, RiTimerFlashLine, RiShoppingCart2Line]}
        items={[
          { label: 'Average capacity utilisation', value: frac(d.kpis.avgUtilisation), delta: `Target ${TARGET * 100}% or more` },
          { label: 'Stores with spare capacity', value: fmt(d.kpis.spareCapacityStores), delta: `of ${fmt(sorted.length)} stores` },
          { label: 'Peak-hour constrained stores', value: fmt(d.kpis.constrainedStores), delta: 'Pausing orders at peak' },
          { label: 'Potential additional orders/day', value: fmt(d.kpis.potentialOrdersDay), delta: 'Lost while stores were paused' },
        ]}
      />
      <AiInsights scope="utilisation" title="How to put spare capacity to work" />
      <Box className="mt" title="Capacity utilisation by store" sub="One bar per store, least to most utilised. Hover a bar for the store.">
        <BarChart
          values={sorted.map((s) => Math.round(s.utilisation * 100))}
          labels={sorted.map((s) => `${s.code} · ${s.area}`)}
          name="Utilisation"
          unit="%"
          h={220}
          max={100}
          refX={spare / (sorted.length || 1)}
        />
        <Legend>
          <LegendItem color="#FF5200">Spare capacity (below {TARGET * 100}%)</LegendItem>
          <LegendItem color="#1F6FEB">Well utilised</LegendItem>
          <LegendItem kind="dash">Target utilisation</LegendItem>
        </Legend>
      </Box>
      <Box className="mt scroll" title="Store utilisation opportunities" sub="The eight least-utilised stores, with the constraint holding each one back.">
        <SimpleTable
          head={['Store', { t: 'Orders/day', r: true }, { t: 'Estimated capacity', r: true }, { t: 'Utilisation', r: true }, 'Likely constraint', 'Next action']}
          rows={sorted.slice(0, 8).map((s) => [
            <>
              <StoreLink code={s.code} /> {s.area}
            </>,
            { v: fmt(s.ordersDay), r: true },
            { v: fmt(s.capacityDay), r: true },
            { v: frac(s.utilisation), r: true, cls: `num ${s.utilisation < TARGET ? 'loss' : ''}` },
            <Pill key="c" variant={CONSTRAINT[s.constraint] ?? ''}>{s.constraint}</Pill>,
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
        sub="How much of each store's operating capacity is used, where capacity is constrained, and where more orders can be absorbed."
      />
      <ScreenData name="utilisation">{(d) => <UtilisationBody d={d} />}</ScreenData>
    </section>
  )
}
