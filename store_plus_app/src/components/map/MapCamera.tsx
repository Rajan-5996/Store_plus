import { useEffect, useRef } from 'react'
import { useMap } from '@/components/ui/map'
import { useAppSelector } from '@/app/hooks'
import { selectMapWarehouses } from '@/features/dashboard/selectors'
import { cameraTarget } from './cameraTarget'

/** Glides the camera (zoom, tilt, heading) to the selected city or store instead of jumping there. */
export default function MapCamera() {
  const { map, isLoaded } = useMap()
  const { city, store } = useAppSelector((s) => s.filters)
  const stores = useAppSelector(selectMapWarehouses)
  const first = useRef(true)

  useEffect(() => {
    if (!map || !isLoaded) return
    if (first.current) {
      first.current = false // the map already starts at this target
      return
    }
    const t = cameraTarget(city, store, stores)
    map.flyTo({ ...t, duration: 3600, curve: 1.7, essential: true })
  }, [map, isLoaded, city, store, stores])

  return null
}
