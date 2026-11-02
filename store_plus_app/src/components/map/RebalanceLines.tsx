import { useEffect } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useMap } from '@/components/ui/map'
import { selectAllWarehouses } from '@/features/dashboard/selectors'
import { detailKey } from '@/features/store/storeSlice'

const ID = 'rebalance-moves'
const COLORS = { Demand: '#1F6FEB', Stock: '#16A34A', Staff: '#7C3AED' }

/** Draws each suggested move of the selected store as a dashed line from the sending to the receiving store. */
export default function RebalanceLines() {
  const { map, isLoaded } = useMap()
  const focus = useAppSelector((s) => s.filters.focus)
  const range = useAppSelector((s) => s.filters.range)
  const moves = useAppSelector((s) => (focus ? s.store.rebalance[detailKey(focus.replace(/\D/g, ''), range)]?.data?.moves : undefined))
  const warehouses = useAppSelector(selectAllWarehouses)

  useEffect(() => {
    if (!map || !isLoaded) return
    const at = (code: string) => warehouses.find((w) => w.id === code)
    const features = (moves ?? []).flatMap((m) => {
      const a = at(m.from.code)
      const b = at(m.to.code)
      return a && b
        ? [{ type: 'Feature' as const, properties: { color: COLORS[m.kind] }, geometry: { type: 'LineString' as const, coordinates: [[a.lng, a.lat], [b.lng, b.lat]] } }]
        : []
    })
    const data = { type: 'FeatureCollection' as const, features }
    const src = map.getSource(ID) as { setData: (d: typeof data) => void } | undefined
    if (src) {
      src.setData(data)
      return
    }
    map.addSource(ID, { type: 'geojson', data })
    map.addLayer({ id: ID, type: 'line', source: ID, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [2, 1.5], 'line-opacity': 0.9 } })
  }, [map, isLoaded, moves, warehouses])

  useEffect(
    () => () => {
      if (map?.getLayer(ID)) map.removeLayer(ID)
      if (map?.getSource(ID)) map.removeSource(ID)
    },
    [map],
  )
  return null
}
