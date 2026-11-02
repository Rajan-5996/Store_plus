export type WarehouseStatus = 'profit' | 'mid' | 'loss'

export interface Warehouse {
  id: string
  name: string
  lng: number
  lat: number
  status: WarehouseStatus
  orders: number
  pnl: string
  note: string
}

/** Sample dark stores around Bengaluru. Static for now; to be replaced with live data. */
export const warehouses: Warehouse[] = [
  { id: '#412', name: 'HSR Layout', lng: 77.6389, lat: 12.9116, status: 'loss', orders: 610, pnl: '–₹12,000/day', note: 'Evening picking queue' },
  { id: '#415', name: 'Agara', lng: 77.6411, lat: 12.9226, status: 'loss', orders: 520, pnl: '–₹10,400/day', note: '~40% zone overlap with #412' },
  { id: '#389', name: 'Koramangala', lng: 77.6245, lat: 12.9352, status: 'profit', orders: 1040, pnl: '+₹9,200/day', note: 'Healthy, spare capacity' },
  { id: '#401', name: 'Indiranagar', lng: 77.6408, lat: 12.9784, status: 'profit', orders: 1120, pnl: '+₹14,500/day', note: 'Top performer' },
  { id: '#388', name: 'BTM Layout', lng: 77.6101, lat: 12.9166, status: 'mid', orders: 750, pnl: '–₹800/day', note: 'Near break-even' },
  { id: '#430', name: 'Jayanagar', lng: 77.5838, lat: 12.9308, status: 'mid', orders: 770, pnl: '+₹400/day', note: 'Near break-even' },
  { id: '#422', name: 'Bellandur', lng: 77.6784, lat: 12.9304, status: 'loss', orders: 560, pnl: '–₹9,600/day', note: 'Weak demand' },
  { id: '#409', name: 'Marathahalli', lng: 77.6974, lat: 12.9591, status: 'profit', orders: 980, pnl: '+₹7,800/day', note: 'Expansion candidate nearby' },
]

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
