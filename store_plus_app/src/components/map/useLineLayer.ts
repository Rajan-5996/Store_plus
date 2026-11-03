import { useEffect } from 'react'
import type { LineLayerSpecification } from 'maplibre-gl'
import { useMap } from '@/components/ui/map'

export interface MapLine {
  color: string
  from: [number, number]
  to: [number, number]
}

/** Keeps one GeoJSON line layer in sync with `lines` (pass a memoised array and a module-level paint); removed on unmount. */
export function useLineLayer(id: string, lines: MapLine[], paint: LineLayerSpecification['paint']) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return
    const features = lines.map((l) => ({
      type: 'Feature' as const,
      properties: { color: l.color },
      geometry: { type: 'LineString' as const, coordinates: [l.from, l.to] },
    }))
    const data = { type: 'FeatureCollection' as const, features }
    const src = map.getSource(id) as { setData: (d: typeof data) => void } | undefined
    if (src) {
      src.setData(data)
      return
    }
    map.addSource(id, { type: 'geojson', data })
    map.addLayer({ id, type: 'line', source: id, paint })
  }, [map, isLoaded, id, lines, paint])

  useEffect(
    () => () => {
      if (map?.getLayer(id)) map.removeLayer(id)
      if (map?.getSource(id)) map.removeSource(id)
    },
    [map, id],
  )
}
