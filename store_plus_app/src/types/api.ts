/** Response shapes of the StorePulse FastAPI backend (one per screen). */
export interface Candle {
  open: number
  close: number
  low: number
  high: number
}

export interface OverviewData {
  range: { start: string; end: string; days: number }
  kpis: {
    totalStores: number
    aboveBreakEven: number
    losingStores: number
    dailyNetworkLoss: number
    avgOrdersPerStoreDay: number
    ordersDeltaPct: number | null
  }
  weekly: { candles: Candle[]; breakEven: number | null }
  causes: { label: string; value: number }[]
  lossTrend: { date: string; pnl: number }[]
  topLosers: { id: string; area: string; city: string; lossPerDay: number; cause: string }[]
}

export interface UtilStore {
  code: string
  area: string
  ordersDay: number
  capacityDay: number
  utilisation: number
  busyMinDay: number
  lostDay: number
  constraint: string
  action: string
}

export interface UtilisationData {
  kpis: { avgUtilisation: number; spareCapacityStores: number; constrainedStores: number; potentialOrdersDay: number }
  stores: UtilStore[]
  table: UtilStore[]
}

export interface InventoryData {
  kpis: { stockoutRate: number; atRiskValue: number; slowSkus: number; replenishmentAlerts: number }
  categoryHealth: { label: string; pct: number }[]
  queue: { code: string; sku: string; onHand: number; forecast: number; risk: string; action: string }[]
}

export interface OperationsData {
  kpis: { medianPickMin: number | null; peakQueueMin: number | null; pauseMinDay: number | null; ordersPerPickerHour: number | null }
  queueByHour: { hours: number[]; values: number[]; peak: [number, number] }
  candidates: { code: string; issue: string; evidence: string; intervention: string; measure: string }[]
}

export interface ProfitabilityData {
  kpis: {
    totalStores: number
    aboveBreakEven: number
    dailyNetworkLoss: number
    contributionPerOrder: number
    contributionMarginPct: number
    topCostDrivers: string[]
  }
  focusStore: {
    code: string
    area: string
    city: string
    ordersDay: number
    contributionPerOrder: number
    dailyContribution: number
    opexDay: number
    breakEvenOrders: number | null
    pnlDay: number
  } | null
  costBreakdown: { label: string; pct: number; perDay: number }[]
  stores: { code: string; area: string; city: string; pnlDay: number; ordersDay: number }[]
}

export type WarehouseStatus = 'profit' | 'mid' | 'loss'

export interface WarehouseApi {
  id: string
  name: string
  city: string
  cityCode: string
  lng: number
  lat: number
  status: WarehouseStatus
  orders: number
  pnlDay: number
  note: string
}

export interface NetworkData {
  kpis: { stores: number; highOverlapPairs: number; underservedPockets: number; expansionCandidates: number }
  warehouses: WarehouseApi[]
  scorecard: { name: string; demand: string; coverage: string; overlap: string; investment: string; recommendation: string }[]
}

export interface ProductMixData {
  kpis: { avgBasketValue: number; categoriesAnalysed: number; lowContributionSkus: number; assortmentOpportunities: number }
  categoryProfile: { label: string; marginPct: number; revenue: number }[]
  table: { category: string; sales: string; contribution: string; availability: string; opportunity: string; decision: string }[]
}

export interface ScreenMap {
  overview: OverviewData
  utilisation: UtilisationData
  inventory: InventoryData
  operations: OperationsData
  profitability: ProfitabilityData
  network: NetworkData
  productmix: ProductMixData
}
export type ScreenName = keyof ScreenMap

export interface FilterOptions {
  cities: { code: string; name: string }[]
  ranges: { key: string; label: string }[]
}
