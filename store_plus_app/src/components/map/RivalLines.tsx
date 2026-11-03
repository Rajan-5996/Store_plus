import { useMemo } from 'react'
import type { LineLayerSpecification } from 'maplibre-gl'
import { useAppSelector } from '@/app/hooks'
import { useMap } from '@/components/ui/map'
import { selectAllWarehouses, selectMapCompetitors } from '@/features/dashboard/selectors'
import { RIVAL_COLOR } from '@/data/competitors'
import { useLineLayer, type MapLine } from './useLineLayer'

const ID = 'rival-links'
const PAINT: LineLayerSpecification['paint'] = { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [1, 2], 'line-opacity': 0.6 }

/** For the selected store, a thin dotted line to every competitor store within reach, so the rivals next door stand out. */
export default function RivalLines() {
  const { resolvedTheme } = useMap()
  const focus = useAppSelector((s) => s.filters.focus)
  const warehouses = useAppSelector(selectAllWarehouses)
  const competitors = useAppSelector(selectMapCompetitors)

  const lines = useMemo(() => {
    const w = warehouses.find((x) => x.id === focus)
    if (!w) return []
    const color = resolvedTheme === 'dark' ? '#FFF4EC' : RIVAL_COLOR
    return w.rivals.flatMap((r): MapLine[] => {
      const c = competitors.find((x) => x.id === r.id)
      return c ? [{ color, from: [w.lng, w.lat], to: [c.lng, c.lat] }] : []
    })
  }, [focus, warehouses, competitors, resolvedTheme])

  useLineLayer(ID, lines, PAINT)
  return null
}
