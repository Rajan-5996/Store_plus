import { useEffect } from 'react'
import { useMap } from '@/components/ui/map'
import { warehouses } from '@/data/warehouses'
import { WAREHOUSE_LAYER_ID, createWarehouseLayer } from './warehouseScene'

const SKY = {
  light: { 'sky-color': '#9CCBFF', 'horizon-color': '#FFE3D0', 'fog-color': '#FFF1E6', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.25 },
  dark: { 'sky-color': '#16213A', 'horizon-color': '#3A2A3E', 'fog-color': '#241E2E', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.25 },
}

/** Adds the three.js 3D scene (warehouses, riders, clouds) and a sky to the surrounding <Map>. Renders nothing itself. */
export default function WarehouseLayer() {
  const { map, mapLib, isLoaded, resolvedTheme } = useMap()

  useEffect(() => {
    if (!map || !mapLib || !isLoaded) return
    const add = () => {
      if (!map.getLayer(WAREHOUSE_LAYER_ID)) map.addLayer(createWarehouseLayer(mapLib, warehouses))
      map.setSky(SKY[resolvedTheme]) // fills the area above the horizon when the map is tilted low
    }
    add()
    // the basemap style is swapped when the theme changes, which drops custom layers and sky — re-add them
    map.on('style.load', add)
    return () => {
      map.off('style.load', add)
      if (map.getLayer(WAREHOUSE_LAYER_ID)) map.removeLayer(WAREHOUSE_LAYER_ID)
    }
  }, [map, mapLib, isLoaded, resolvedTheme])

  return null
}
