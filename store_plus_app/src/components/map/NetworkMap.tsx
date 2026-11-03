import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectMapWarehouses } from '@/features/dashboard/selectors'
import { Map, MapControls } from '@/components/ui/map'
import CompetitorMarkers from './CompetitorMarkers'
import FocusCamera from './FocusCamera'
import MapCamera from './MapCamera'
import MapFilters from './MapFilters'
import MapLegend from './MapLegend'
import { cameraTarget } from './cameraTarget'
import OrbitGestures from './OrbitGestures'
import RebalanceLines from './RebalanceLines'
import RivalLines from './RivalLines'
import WarehouseLayer from './WarehouseLayer'
import WarehouseMarkers from './WarehouseMarkers'

/** Interactive 3D network map: MapLibre basemap (shadcn map) + three.js warehouses, catchments, riders, store and competitor pins. */
export default function NetworkMap() {
  const { city, store } = useAppSelector((s) => s.filters)
  const stores = useAppSelector(selectMapWarehouses)
  const start = cameraTarget(city, store, stores)
  const [rivals, setRivals] = useState(true)

  return (
    <>
      <MapLegend rivalsShown={rivals} onToggleRivals={() => setRivals((v) => !v)} />
      <div className="relative h-130 w-full overflow-hidden rounded-xl">
        <Map className="size-full" maxPitch={85} viewport={start} attributionControl={false}>
          <WarehouseLayer />
          {rivals && <CompetitorMarkers />}
          <WarehouseMarkers />
          <MapControls position="top-right" showZoom showCompass showFullscreen />
          <MapCamera />
          <FocusCamera />
          {rivals && <RivalLines />}
          <RebalanceLines />
          <OrbitGestures />
        </Map>
        <MapFilters />
      </div>
    </>
  )
}
