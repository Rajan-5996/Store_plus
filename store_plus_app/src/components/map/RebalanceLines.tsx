import { useMemo } from 'react'
import type { LineLayerSpecification } from 'maplibre-gl'
import { useAppSelector } from '@/app/hooks'
import { selectAllWarehouses } from '@/features/dashboard/selectors'
import { detailKey } from '@/features/store/storeSlice'
import { useLineLayer, type MapLine } from './useLineLayer'

const ID = 'rebalance-moves'
const COLORS = { Demand: '#1F6FEB', Stock: '#16A34A', Staff: '#7C3AED' }
const PAINT: LineLayerSpecification['paint'] = { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [2, 1.5], 'line-opacity': 0.9 }

/** Draws each suggested move of the selected store as a dashed line from the sending to the receiving store. */
export default function RebalanceLines() {
  const focus = useAppSelector((s) => s.filters.focus)
  const range = useAppSelector((s) => s.filters.range)
  const moves = useAppSelector((s) => (focus ? s.store.rebalance[detailKey(focus.replace(/\D/g, ''), range)]?.data?.moves : undefined))
  const warehouses = useAppSelector(selectAllWarehouses)

  const lines = useMemo(() => {
    const at = (code: string) => warehouses.find((w) => w.id === code)
    return (moves ?? []).flatMap((m): MapLine[] => {
      const a = at(m.from.code)
      const b = at(m.to.code)
      return a && b ? [{ color: COLORS[m.kind], from: [a.lng, a.lat], to: [b.lng, b.lat] }] : []
    })
  }, [moves, warehouses])

  useLineLayer(ID, lines, PAINT)
  return null
}
