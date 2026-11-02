import { RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine } from '@remixicon/react'
import NetworkMap from '../components/map/NetworkMap'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import Pill from '../components/ui/Pill'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import NetworkInsights from './network/NetworkInsights'
import { fmt } from '../lib/format'
import type { NetworkData } from '../types/api'

function NetworkBody({ d }: { d: NetworkData }) {
  return (
    <>
      <KpiGrid
        icons={[RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine]}
        items={[
          { label: 'Stores in network', value: fmt(d.kpis.stores) },
          { label: 'High-overlap pairs', value: fmt(d.kpis.highOverlapPairs) },
          { label: 'Underserved demand pockets', value: fmt(d.kpis.underservedPockets) },
          { label: 'Expansion candidates', value: fmt(d.kpis.expansionCandidates) },
        ]}
      />
      <div className="grid g21 mt fill-grid">
        <Box title="Catchment and store coverage">
          <NetworkMap />
        </Box>
        <NetworkInsights />
      </div>
      <Box className="mt scroll" title="Location decision scorecard">
        <SimpleTable
          head={['Area / store pair', 'Demand density', 'Current coverage', 'Overlap risk', 'Investment', 'Recommendation']}
          rows={d.scorecard.map((r) => [
            r.name,
            r.demand,
            r.coverage,
            r.overlap === 'High' ? <Pill variant="red">High</Pill> : r.overlap,
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
