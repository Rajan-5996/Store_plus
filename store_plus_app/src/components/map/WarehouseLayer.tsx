import { useEffect } from 'react'
import { useMap } from '@/components/ui/map'
import { useAppSelector } from '@/app/hooks'
import { selectAllWarehouses } from '@/features/dashboard/selectors'
import { WAREHOUSE_LAYER_ID, createWarehouseLayer } from './warehouseScene'

const SKY = {
  light: { 'sky-color': '#9CCBFF', 'horizon-color': '#FFE3D0', 'fog-color': '#FFF1E6', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.25 },
  dark: { 'sky-color': '#16213A', 'horizon-color': '#3A2A3E', 'fog-color': '#241E2E', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.25 },
}

/**
 * Adds the three.js 3D scene (warehouses, riders, clouds) and a sky to the surrounding <Map>.
 * One layer per city: each city has its own local origin, so stores hundreds of km apart stay precise.
 */
export default function WarehouseLayer() {
  const { map, mapLib, isLoaded, resolvedTheme } = useMap()
  const warehouses = useAppSelector(selectAllWarehouses)

  useEffect(() => {
    if (!map || !mapLib || !isLoaded || warehouses.length === 0) return
    const groups = new globalThis.Map<string, typeof warehouses>()
    for (const w of warehouses) groups.set(w.cityCode, [...(groups.get(w.cityCode) ?? []), w])
    const byCity = [...groups.entries()]
    const ids = byCity.map(([code]) => `${WAREHOUSE_LAYER_ID}-${code}`)
    const add = () => {
      byCity.forEach(([, items], i) => {
        if (!map.getLayer(ids[i])) map.addLayer(createWarehouseLayer(mapLib, items, ids[i], byCity.length > 1 ? 10 : 36))
      })
      map.setSky(SKY[resolvedTheme]) // fills the area above the horizon when the map is tilted low
    }
    add()
    // the basemap style is swapped when the theme changes, which drops custom layers and sky — re-add them
    map.on('style.load', add)
    return () => {
      map.off('style.load', add)
      ids.forEach((id) => map.getLayer(id) && map.removeLayer(id))
    }
  }, [map, mapLib, isLoaded, resolvedTheme, warehouses])

  return null
}
