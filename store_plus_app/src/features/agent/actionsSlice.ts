import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { apiGet } from '@/lib/api'
import type { ActionsPayload } from '@/types/store'

export type ActionsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ActionsEntry {
  data: ActionsPayload | null
  status: ActionsStatus
  error: string | null
  requestId: string | null
}

/** A scope is a dashboard screen ("utilisation") or one store ("store:524"). */
export const actionsKey = (scope: string, city: string, range: string): string =>
  scope.startsWith('store:') ? `${scope}|${range}` : `${scope}|${city}|${range}`

export const selectActions = (key: string) => (s: RootState): ActionsEntry | undefined => s.actions.entries[key]

interface Arg {
  scope: string
  /** Cache key from `actionsKey`, so the reducers can find the entry. */
  key: string
  refresh?: boolean
}

/** Ask the backend for the agent's recommended actions (cached server-side; `refresh` asks the model again). */
export const fetchActions = createAsyncThunk('actions/fetch', async ({ scope, refresh }: Arg, { getState }) => {
  const { city, range } = (getState() as RootState).filters
  const extra: Record<string, string> = refresh ? { refresh: 'true' } : {}
  return scope.startsWith('store:')
    ? apiGet<ActionsPayload>(`/api/stores/${scope.slice(6)}/actions`, { range, ...extra })
    : apiGet<ActionsPayload>('/api/agent/actions', { screen: scope, city, range, ...extra })
})

const actionsSlice = createSlice({
  name: 'actions',
  initialState: { entries: {} as Record<string, ActionsEntry> },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchActions.pending, (s, a) => {
      const key = a.meta.arg.key
      const e = (s.entries[key] ??= { data: null, status: 'idle', error: null, requestId: null })
      e.status = 'loading'
      e.error = null
      e.requestId = a.meta.requestId
    })
    b.addCase(fetchActions.fulfilled, (s, a) => {
      const e = s.entries[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.data = a.payload
      e.status = 'ready'
    })
    b.addCase(fetchActions.rejected, (s, a) => {
      const e = s.entries[a.meta.arg.key]
      if (!e || e.requestId !== a.meta.requestId) return
      e.status = 'error'
      e.error = a.error.message ?? 'Request failed'
    })
  },
})

export default actionsSlice.reducer
