import { RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine } from '@remixicon/react'
import AiInsights from '../components/insights/AiInsights'
import NetworkMap from '../components/map/NetworkMap'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import Pill, { type PillVariant } from '../components/ui/Pill'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import NetworkInsights from './network/NetworkInsights'
import { fmt } from '../lib/format'
import type { NetworkData } from '../types/api'

/** Level pills: how much of something there is, and whether that is good news for the decision. */
const LEVEL: Record<string, Record<string, PillVariant>> = {
  demand: { High: 'green', Medium: 'warn', Low: '' },
  coverage: { Strong: 'green', Medium: 'warn', Low: 'red' },
  overlap: { High: 'red', Medium: 'warn', Low: 'green' },
}

function NetworkBody({ d }: { d: NetworkData }) {
  return (
    <>
      <KpiGrid
        icons={[RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine]}
        items={[
          { label: 'Stores in network', value: fmt(d.kpis.stores), delta: 'In the selected city' },
          { label: 'High-overlap pairs', value: fmt(d.kpis.highOverlapPairs), delta: 'Stores competing for the same area' },
          { label: 'Underserved demand pockets', value: fmt(d.kpis.underservedPockets), delta: 'Demand outside every zone' },
          { label: 'Expansion candidates', value: fmt(d.kpis.expansionCandidates), delta: 'Pockets worth a new store' },
        ]}
      />
      <AiInsights scope="network" title="Network decisions on overlap and coverage" />
      <div className="grid g21 mt fill-grid">
        <Box
          title="Catchment and store coverage"
          sub="Stores coloured by daily profit, competitors as diamonds in their brand colours. Drag to rotate, scroll to move, pinch to zoom; select a store to see the rivals near it."
        >
          <NetworkMap />
        </Box>
        <NetworkInsights />
      </div>
      <Box className="mt scroll" title="Location decision scorecard" sub="Overlapping store pairs to rebalance, and underserved pockets to cover.">
        <SimpleTable
          head={['Area / store pair', 'Demand density', 'Current coverage', 'Overlap risk', 'Investment', 'Recommendation']}
          rows={d.scorecard.map((r) => [
            <b key="n">{r.name}</b>,
            <Pill key="d" variant={LEVEL.demand[r.demand] ?? ''}>{r.demand}</Pill>,
            <Pill key="c" variant={LEVEL.coverage[r.coverage] ?? ''}>{r.coverage}</Pill>,
            <Pill key="o" variant={LEVEL.overlap[r.overlap] ?? ''}>{r.overlap}</Pill>,
            r.investment,
            r.recommendation,
          ])}
        />
      </Box>
    </>
  )
}

export default function Network() {
  return (
    <section>
      <ScreenHeader
        title="Network optimisation"
        sub="Plan store coverage and capacity across neighbourhoods. Find overlap, underserved demand and opportunities to improve the existing footprint."
      />
      <ScreenData name="network">{(d) => <NetworkBody d={d} />}</ScreenData>
    </section>
  )
}
