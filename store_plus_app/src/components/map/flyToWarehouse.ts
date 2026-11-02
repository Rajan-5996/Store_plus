import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Warehouse } from '@/data/warehouses'

/** Fly the camera to a warehouse, close enough to see the building and its riders from any side. */
export function flyToWarehouse(map: MapLibreMap, w: Warehouse) {
  map.flyTo({
    center: [w.lng, w.lat],
    zoom: 15.4,
    pitch: 62,
    bearing: map.getBearing(),
    duration: 1600,
    essential: true,
  })
}
