import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiGet } from '@/lib/api'
import type { ScreenMap, ScreenName } from '@/types/api'
import type { RootState } from '@/app/store'

export type Status = 'idle' | 'loading' | 'ready' | 'error'

interface Entry<T> {
  data: T | null
  status: Status
  error: string | null
  requestId: string | null
}

type DashboardState = { [K in ScreenName]: Entry<ScreenMap[K]> }

const empty = <T>(): Entry<T> => ({ data: null, status: 'idle', error: null, requestId: null })

const initialState: DashboardState = {
  overview: empty(),
  utilisation: empty(),
  inventory: empty(),
  operations: empty(),
  profitability: empty(),
  network: empty(),
  productmix: empty(),
}

/** Load one screen's data from the backend using the current City / Date-range filters. */
export const fetchScreen = createAsyncThunk('dashboard/fetch', async (screen: ScreenName, { getState }) => {
  const { city, range } = (getState() as RootState).filters
  return apiGet<ScreenMap[ScreenName]>(`/api/${screen}`, { city, range })
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchScreen.pending, (s, a) => {
      const e = s[a.meta.arg]
      e.status = 'loading'
      e.requestId = a.meta.requestId
      e.error = null
    })
    b.addCase(fetchScreen.fulfilled, (s, a) => {
      const e = s[a.meta.arg] as Entry<unknown>
      if (e.requestId !== a.meta.requestId) return // a newer request superseded this one
      e.data = a.payload
      e.status = 'ready'
    })
    b.addCase(fetchScreen.rejected, (s, a) => {
      const e = s[a.meta.arg]
      if (e.requestId !== a.meta.requestId) return
      e.status = 'error'
      e.error = a.error.message ?? 'Request failed'
    })
  },
})

export default dashboardSlice.reducer
