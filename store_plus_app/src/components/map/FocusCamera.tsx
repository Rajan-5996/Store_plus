import { useEffect } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useMap } from '@/components/ui/map'
import { selectAllWarehouses } from '@/features/dashboard/selectors'
import { flyToWarehouse } from './flyToWarehouse'

/** Flies the camera to the store selected for recommendations (a pin click, a rebalancing end or a "worst stores" chip). */
export default function FocusCamera() {
  const { map, isLoaded } = useMap()
  const focus = useAppSelector((s) => s.filters.focus)
  const warehouses = useAppSelector(selectAllWarehouses)

  useEffect(() => {
    const w = warehouses.find((x) => x.id === focus)
    if (map && isLoaded && w) flyToWarehouse(map, w)
  }, [map, isLoaded, focus, warehouses])

  return null
}
