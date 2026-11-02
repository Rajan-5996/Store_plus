import { useAppSelector } from '@/app/hooks'
import { selectMapWarehouses } from '@/features/dashboard/selectors'
import { Map, MapControls } from '@/components/ui/map'
import { STATUS_COLORS, STATUS_LABELS, type WarehouseStatus } from '@/data/warehouses'
import MapCamera from './MapCamera'
import MapFilters from './MapFilters'
import { cameraTarget } from './cameraTarget'
import OrbitGestures from './OrbitGestures'
import WarehouseLayer from './WarehouseLayer'
import WarehouseMarkers from './WarehouseMarkers'

const legend: WarehouseStatus[] = ['profit', 'mid', 'loss']

/** Interactive 3D network map: MapLibre basemap (shadcn map) + three.js warehouses, catchments, riders and store pins. */
export default function NetworkMap() {
  const { city, store } = useAppSelector((s) => s.filters)
  const stores = useAppSelector(selectMapWarehouses)
  const regions = new Set(stores.map((w) => w.city))
  const label = regions.size === 1 ? stores[0].city : `${regions.size} cities`
  const nationwide = city === 'all'
  const start = cameraTarget(city, store, stores)

  return (
    <div className="relative h-130 w-full overflow-hidden rounded-xl">
      <Map className="size-full" maxPitch={85} viewport={start}>
        <WarehouseLayer />
        <WarehouseMarkers />
        <MapControls position="top-right" showZoom showCompass showFullscreen />
        <MapCamera />
        <OrbitGestures />
      </Map>
      <MapFilters />

      <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-x-3 gap-y-1 rounded-lg bg-card/85 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur">
        {stores.length > 0 && <span>{label} · {stores.length} stores</span>}
        {legend.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
        <span className="text-muted-foreground">Drag to rotate and tilt · Scroll or swipe to move the map · Pinch to zoom · Click a pin to fly in{nationwide && ' · Pick a city to see its stores up close'}</span>
      </div>
    </div>
  )
}
