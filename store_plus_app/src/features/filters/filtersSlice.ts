import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiGet } from '@/lib/api'
import type { FilterOptions } from '@/types/api'

interface FiltersState {
  city: string
  /** Store code selected on the map ('all' = every store of the city). */
  store: string
  range: string
  options: FilterOptions
}

const initialState: FiltersState = {
  city: 'all',
  store: 'all',
  range: '30d',
  options: {
    cities: [{ code: 'all', name: 'All cities' }],
    ranges: [{ key: '30d', label: 'Last 30 days' }],
  },
}

export const fetchFilterOptions = createAsyncThunk('filters/options', () => apiGet<FilterOptions>('/api/meta/filters'))

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCity: (s, a: PayloadAction<string>) => {
      s.city = a.payload
      s.store = 'all'
    },
    setStore: (s, a: PayloadAction<string>) => {
      s.store = a.payload
    },
    setRange: (s, a: PayloadAction<string>) => {
      s.range = a.payload
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchFilterOptions.fulfilled, (s, a) => {
      s.options = a.payload
    })
  },
})

export const { setCity, setStore, setRange } = filtersSlice.actions
export default filtersSlice.reducer
