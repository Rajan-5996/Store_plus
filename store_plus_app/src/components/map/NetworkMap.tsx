import { Map, MapControls } from '@/components/ui/map'
import { STATUS_COLORS, STATUS_LABELS, type WarehouseStatus } from '@/data/warehouses'
import OrbitGestures from './OrbitGestures'
import WarehouseLayer from './WarehouseLayer'
import WarehouseMarkers from './WarehouseMarkers'

const legend: WarehouseStatus[] = ['profit', 'mid', 'loss']

/** Interactive 3D network map: MapLibre basemap (shadcn map) + three.js warehouses, catchments, riders and store pins. */
export default function NetworkMap() {
  return (
    <div className="relative h-130 w-full overflow-hidden rounded-xl">
      <Map
        className="size-full"
        maxPitch={85}
        viewport={{ center: [77.6405, 12.9445], zoom: 11.8, pitch: 58, bearing: -18 }}
      >
        <WarehouseLayer />
        <WarehouseMarkers />
        <MapControls position="top-right" showZoom showCompass showFullscreen />
        <OrbitGestures />
      </Map>

      <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-x-3 gap-y-1 rounded-lg bg-card/85 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur">
        {legend.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <i className="inline-block size-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
        <span className="text-muted-foreground">Drag to rotate and tilt · Scroll or swipe to move the map · Pinch to zoom · Click a pin to fly in</span>
      </div>
    </div>
  )
}
