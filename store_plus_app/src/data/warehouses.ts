import type { WarehouseApi, WarehouseStatus } from '@/types/api'

export type { WarehouseStatus }
/** A dark store on the map; loaded from the backend (`/api/network`). */
export type Warehouse = WarehouseApi

export const STATUS_COLORS: Record<WarehouseStatus, string> = {
  profit: '#1F6FEB',
  mid: '#F59E0B',
  loss: '#FF5200',
}

export const STATUS_LABELS: Record<WarehouseStatus, string> = {
  profit: 'Profitable',
  mid: 'Near break-even',
  loss: 'Losing',
}
