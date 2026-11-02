import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { apiGet } from '@/lib/api'
import type { Rebalance, Replenishment, StoreDetail, StoreListItem } from '@/types/store'

export type StoreStatusKey = 'idle' | 'loading' | 'ready' | 'error'

interface DetailEntry {
  data: StoreDetail | null
  status: StoreStatusKey
  error: string | null
  requestId: string | null
}

interface RebalanceEntry {
  data: Rebalance | null
  status: StoreStatusKey
  error: string | null
  requestId: string | null
}

interface ReplenishEntry {
  data: Replenishment | null
  status: StoreStatusKey
  error: string | null
  requestId: string | null
}

interface StoreState {
  list: StoreListItem[]
  details: Record<string, DetailEntry>
  rebalance: Record<string, RebalanceEntry>
  replenish: Record<string, ReplenishEntry>
}

/** The store page is cached per store and date range. */
export const detailKey = (code: string, range: string): string => `${code}|${range}`

export const fetchStoreList = createAsyncThunk('store/list', async (_: void, { getState }) =>
  apiGet<StoreListItem[]>('/api/stores', { range: (getState() as RootState).filters.range }),
)

export const fetchStore = createAsyncThunk('store/detail', async ({ code }: { code: string; key: string }, { getState }) =>
  apiGet<StoreDetail>(`/api/stores/${code}`, { range: (getState() as RootState).filters.range }),
)

export const fetchRebalance = createAsyncThunk('store/rebalance', async ({ code }: { code: string; key: string }, { getState }) =>
  apiGet<Rebalance>(`/api/stores/${code}/rebalance`, { range: (getState() as RootState).filters.range }),
)

export const fetchReplenishment = createAsyncThunk('store/replenish', async ({ code }: { code: string; key: string }, { getState }) =>
  apiGet<Replenishment>(`/api/stores/${code}/replenishment`, { range: (getState() as RootState).filters.range }),
)

const storeSlice = createSlice({
  name: 'store',
  initialState: { list: [], details: {}, rebalance: {}, replenish: {} } as StoreState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchStoreList.fulfilled, (s, a) => {
      s.list = a.payload
    })
    b.addCase(fetchStore.pending, (s, a) => {
      const e = (s.details[a.meta.arg.key] ??= { data: null, status: 'idle', error: null, requestId: null })
      e.status = 'loading'
      e.error = null
      e.requestId = a.meta.requestId
    })
    b.addCase(fetchStore.fulfilled, (s, a) => {
      const e = s.details[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.data = a.payload
      e.status = 'ready'
    })
    b.addCase(fetchRebalance.pending, (s, a) => {
      const e = (s.rebalance[a.meta.arg.key] ??= { data: null, status: 'idle', error: null, requestId: null })
      e.status = 'loading'
      e.error = null
      e.requestId = a.meta.requestId
    })
    b.addCase(fetchRebalance.fulfilled, (s, a) => {
      const e = s.rebalance[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.data = a.payload
      e.status = 'ready'
    })
    b.addCase(fetchRebalance.rejected, (s, a) => {
      const e = s.rebalance[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.status = 'error'
      e.error = a.error.message ?? 'Request failed'
    })
    b.addCase(fetchReplenishment.pending, (s, a) => {
      const e = (s.replenish[a.meta.arg.key] ??= { data: null, status: 'idle', error: null, requestId: null })
      e.status = 'loading'
      e.error = null
      e.requestId = a.meta.requestId
    })
    b.addCase(fetchReplenishment.fulfilled, (s, a) => {
      const e = s.replenish[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.data = a.payload
      e.status = 'ready'
    })
    b.addCase(fetchReplenishment.rejected, (s, a) => {
      const e = s.replenish[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.status = 'error'
      e.error = a.error.message ?? 'Request failed'
    })
    b.addCase(fetchStore.rejected, (s, a) => {
      const e = s.details[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.status = 'error'
      e.error = a.error.message ?? 'Request failed'
    })
  },
})

export default storeSlice.reducer
