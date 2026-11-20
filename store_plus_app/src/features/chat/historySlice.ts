import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiDelete, apiGet } from '@/lib/api'
import type { ChatThreadApi } from '@/types/api'

/** The saved Pulse conversations listed in the History menu (opening one lives in chatSlice: `openThread`). */
interface HistoryState {
  threads: ChatThreadApi[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
}

const initialState: HistoryState = { threads: [], status: 'idle' }

/** Saved conversations, most recently active first; fetched each time the menu opens so it is never stale. */
export const fetchThreads = createAsyncThunk('history/fetch', () => apiGet<ChatThreadApi[]>('/api/agent/threads'))

/** Deletes a conversation's questions and answers on the server for good. */
export const deleteThread = createAsyncThunk('history/delete', async (id: string) => {
  await apiDelete(`/api/agent/threads/${encodeURIComponent(id)}`)
  return id
})

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchThreads.pending, (s) => {
      s.status = 'loading' // keep the last list on screen while it refreshes
      s.error = undefined
    })
    b.addCase(fetchThreads.fulfilled, (s, a) => {
      s.status = 'ready'
      s.threads = a.payload
    })
    b.addCase(fetchThreads.rejected, (s, a) => {
      s.status = 'error'
      s.error = a.error.message ?? 'Could not load your conversations.'
    })
    b.addCase(deleteThread.fulfilled, (s, a) => {
      s.threads = s.threads.filter((t) => t.id !== a.payload)
    })
    b.addCase(deleteThread.rejected, (s, a) => {
      s.error = `Could not delete it: ${a.error.message ?? 'server error'}`
    })
  },
})

export default historySlice.reducer
