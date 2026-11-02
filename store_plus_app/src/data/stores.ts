export type Confidence = 'High' | 'Medium' | 'Low'
export type Cause = 'Stock-out' | 'Weak demand' | 'Picking queue' | 'Overlap'
export type Status = 'New' | 'Under review' | 'Fix running' | 'Resolved'

export interface StoreRow {
  id: string
  area: string
  city: string
  ageMonths: number
  orders: number
  breakEven: number
  cause: Cause
  confidence: Confidence
  status: Status
}

export const CONTRIBUTION_PER_ORDER = 80

export const initialStores: StoreRow[] = [
  { id: '#412', area: 'HSR Layout', city: 'Bengaluru', ageMonths: 7, orders: 610, breakEven: 760, cause: 'Picking queue', confidence: 'High', status: 'New' },
  { id: '#233', area: 'Kondapur', city: 'Hyderabad', ageMonths: 11, orders: 545, breakEven: 690, cause: 'Weak demand', confidence: 'Medium', status: 'New' },
  { id: '#118', area: 'Andheri E', city: 'Mumbai', ageMonths: 14, orders: 700, breakEven: 840, cause: 'Stock-out', confidence: 'High', status: 'Under review' },
  { id: '#415', area: 'Agara', city: 'Bengaluru', ageMonths: 5, orders: 520, breakEven: 650, cause: 'Overlap', confidence: 'High', status: 'New' },
  { id: '#507', area: 'Sector 49', city: 'Gurugram', ageMonths: 9, orders: 640, breakEven: 760, cause: 'Stock-out', confidence: 'Medium', status: 'Fix running' },
  { id: '#301', area: 'Velachery', city: 'Chennai', ageMonths: 4, orders: 480, breakEven: 590, cause: 'Weak demand', confidence: 'Low', status: 'New' },
  { id: '#276', area: 'Kothrud', city: 'Pune', ageMonths: 12, orders: 690, breakEven: 780, cause: 'Picking queue', confidence: 'Medium', status: 'Under review' },
  { id: '#144', area: 'Salt Lake', city: 'Kolkata', ageMonths: 16, orders: 610, breakEven: 690, cause: 'Overlap', confidence: 'Medium', status: 'New' },
]
