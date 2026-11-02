/** Response shapes of the store pages and the AI recommended-actions endpoints. */
export type StoreStatus = 'profit' | 'mid' | 'loss'

export interface StoreListItem {
  code: string
  area: string
  city: string
  ordersDay: number
  pnlDay: number
  status: StoreStatus
}

export interface AgentAction {
  title: string
  why: string
  impact: string
  priority: 'high' | 'medium' | 'low'
  stores: string[]
}

export interface ActionsPayload {
  actions: AgentAction[]
  source: 'domo' | 'mock'
  generatedAt: string
}

interface Peer {
  ordersDay: number | null
  cpo: number | null
  pnlDay: number | null
  opexDay: number | null
  stores: number
}

export interface StoreDetail {
  range: { start: string; end: string; days: number }
  store: {
    code: string
    area: string
    city: string
    cityCode: string
    format: string
    status: StoreStatus
    operating: string
    launchDate: string
    areaSqft: number
    lat: number
    lng: number
  }
  kpis: {
    ordersDay: number
    ordersDeltaPct: number | null
    pnlDay: number
    pnlDeltaDay: number | null
    cpo: number
    opexDay: number
    breakEvenOrders: number | null
    gapOrders: number | null
    cmPct: number
    aov: number | null
  }
  peers: { network: Peer; format: Peer & { name: string }; rankFromWorst: number }
  cause: { label: string; skill: string; scores: { label: string; pct: number; value: number }[] }
  costs: { label: string; perDay: number; pct: number }[]
  series: { dates: string[]; orders: number[]; pnl: number[] }
  hourly: { hour: number; orders: number; capacity: number; lost: number; queue_min: number | null }[]
  ops: {
    utilisation: number | null
    busyMinDay: number | null
    lostOrdersDay: number | null
    queueMin: number | null
    pickers: number | null
    packers: number | null
  }
  funnel: {
    sessions: number
    addToCart: number
    checkout: number
    orders: number
    lostStockout: number
    lostBusy: number
    conversion: number | null
  }
  stock: {
    topStockouts: { sku: string; category: string; lost_units: number; oos_days: number }[]
    wastage: { reason: string; value: number }[]
    wastageTotal: number
  }
  mix: { category: string; share: number; marginPct: number }[]
  nearby: { code: string; area: string; km: number; ordersDay: number; pnlDay: number }[]
}

export interface RebalanceEnd {
  code: string
  area: string
  km: number
}

/** One suggested move between two stores: demand, stock or staff hours. */
export interface RebalanceMove {
  kind: 'Demand' | 'Stock' | 'Staff'
  from: RebalanceEnd
  to: RebalanceEnd
  amount: number
  unit: string
  item?: string
  reason: string
  /** Short label / value pairs behind the reason: the numbers that justify the move. */
  facts: [string, string][]
}

export interface Rebalance {
  store: string
  radiusKm: number
  moves: RebalanceMove[]
}

export type TransferStatus = 'planned' | 'done' | 'cancelled'

/** One row of the transfer log. */
export interface TransferEntry {
  id: number
  createdAt: string
  updatedAt: string
  kind: 'Demand' | 'Stock' | 'Staff'
  item: string | null
  quantity: number
  unit: string
  reason: string
  status: TransferStatus
  from: { code: string; area: string }
  to: { code: string; area: string }
}

export interface ReplenishPoint {
  hour: number
  label: string
  demand: number
  delivery: number
  /** Typical stock left after the hour as things are today. */
  stock: number
  /** Stock left after the hour if the recommended extra delivery is made. */
  stockAfter: number
}

export interface ReplenishItem {
  sku: string
  category: string
  lostDay: number
  demandDay: number
  measuredOutMinutes: number
  outDays: number
  days: number
  peak: { from: number; to: number; fromLabel: string; toLabel: string; sharePct: number }
  runsOutAt: string | null
  unmetDay: number
  plan: { slot: string; arrives: string; extraUnits: number; unmetAfter: number } | null
  events: { label: string; days: number; upliftPct: number; demandDay: number; extraUnits?: number }[]
  curve: ReplenishPoint[]
}

export interface Replenishment {
  store: string
  slots: string[]
  items: ReplenishItem[]
}
