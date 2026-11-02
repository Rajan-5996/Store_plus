import { createSlice } from '@reduxjs/toolkit'
import { initialStores, type StoreRow } from '../../data/stores'

interface StoresState {
  items: StoreRow[]
}

const initialState: StoresState = { items: initialStores }

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
})

export default storesSlice.reducer
