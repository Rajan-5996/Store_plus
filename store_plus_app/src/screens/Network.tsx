import Box from '../components/ui/Box'
import NetworkMap from '../components/map/NetworkMap'
import { RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import Pill from '../components/ui/Pill'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'

export default function Network() {
  return (
    <section>
      <ScreenHeader
        title="Network optimisation"
        sub="Plan store coverage and capacity across neighbourhoods. Find overlap, underserved demand and opportunities to improve the existing footprint."
      />
      <KpiGrid
        icons={[RiStore2Line, RiShareLine, RiMapPinRangeLine, RiMapPinAddLine]}
        items={[
          { label: 'Stores in sample network', value: '50' },
          { label: 'High-overlap pairs', value: '6' },
          { label: 'Underserved demand pockets', value: '4' },
          { label: 'Expansion candidates', value: '3' },
        ]}
      />
      <div className="grid g21 mt">
        <Box title="Catchment and store coverage">
          <NetworkMap />
        </Box>
        <Box title="Network decisions to evaluate">
          <ul>
            <li>Can a nearby store absorb demand from an underutilised store?</li>
            <li>Do service zones overlap without improving customer coverage?</li>
            <li>Are there demand pockets with poor service coverage?</li>
            <li>Would a new location improve economics after cannibalisation?</li>
          </ul>
        </Box>
      </div>
      <Box className="mt scroll" title="Location decision scorecard">
        <SimpleTable
          head={['Area / store pair', 'Demand density', 'Current coverage', 'Overlap risk', 'Investment', 'Recommendation']}
          rows={[
            ['HSR #412 / Agara #415', 'High', 'Strong', <Pill variant="red">High</Pill>, 'Low / operational', 'Test zone and capacity balancing'],
            ['Area candidate B', 'High', 'Low', 'Low', 'To estimate', 'Validate new-store feasibility'],
            ['Kondapur #233', 'Medium', 'Strong', 'Medium', 'Low', 'Improve demand utilisation first'],
          ]}
        />
      </Box>
    </section>
  )
}
