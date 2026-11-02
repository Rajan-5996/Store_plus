import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiGet, apiPatch, apiPost } from '@/lib/api'
import type { RebalanceMove, TransferEntry, TransferStatus } from '@/types/store'

interface TransfersState {
  items: TransferEntry[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

/** Identifies a suggested move, so a card can tell whether it is already in the log. */
interface KeyParts {
  kind: string
  item?: string | null
  from: { code: string }
  to: { code: string }
}

export const moveKey = (m: KeyParts): string => `${m.kind}|${m.item ?? ''}|${m.from.code}|${m.to.code}`

export const entryKey = (e: TransferEntry): string => moveKey(e)

export const fetchTransfers = createAsyncThunk('transfers/fetch', () => apiGet<TransferEntry[]>('/api/transfers'))

/** Put a suggested move in the transfer log as "planned". */
export const logTransfer = createAsyncThunk('transfers/log', (m: RebalanceMove) =>
  apiPost<TransferEntry>('/api/transfers', {
    kind: m.kind,
    item: m.item ?? null,
    quantity: m.amount,
    unit: m.unit,
    from_code: m.from.code,
    from_area: m.from.area,
    to_code: m.to.code,
    to_area: m.to.area,
    reason: m.reason,
  }),
)

export const setTransferStatus = createAsyncThunk('transfers/status', ({ id, status }: { id: number; status: TransferStatus }) =>
  apiPatch<TransferEntry>(`/api/transfers/${id}`, { status }),
)

const upsert = (items: TransferEntry[], e: TransferEntry) => {
  const i = items.findIndex((x) => x.id === e.id)
  if (i >= 0) items[i] = e
  else items.unshift(e)
}

const transfersSlice = createSlice({
  name: 'transfers',
  initialState: { items: [], status: 'idle', error: null } as TransfersState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTransfers.pending, (s) => {
      s.status = 'loading'
    })
    b.addCase(fetchTransfers.fulfilled, (s, a) => {
      s.items = a.payload
      s.status = 'ready'
    })
    b.addCase(fetchTransfers.rejected, (s, a) => {
      s.status = 'error'
      s.error = a.error.message ?? 'Request failed'
    })
    b.addCase(logTransfer.fulfilled, (s, a) => upsert(s.items, a.payload))
    b.addCase(setTransferStatus.fulfilled, (s, a) => upsert(s.items, a.payload))
  },
})

export default transfersSlice.reducer
