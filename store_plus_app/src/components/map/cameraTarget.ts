import type { WarehouseApi } from '@/types/api'

export interface CameraTarget {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

/** Country view used for "All cities" (fits all six cities). */
const COUNTRY: CameraTarget = { center: [78.0, 18.6], zoom: 3.7, pitch: 0, bearing: 0 }

/** Where the camera should look: the country, one city (centre of its stores) or a single store up close. */
export function cameraTarget(city: string, store: string, stores: WarehouseApi[]): CameraTarget {
  if (stores.length === 0 || (city === 'all' && store === 'all')) return COUNTRY
  const lng = stores.reduce((a, w) => a + w.lng, 0) / stores.length
  const lat = stores.reduce((a, w) => a + w.lat, 0) / stores.length
  if (store !== 'all' && stores.length === 1) return { center: [lng, lat], zoom: 15.4, pitch: 62, bearing: -18 }
  return { center: [lng, lat], zoom: 11.8, pitch: 58, bearing: -18 }
}
