import { configureStore } from '@reduxjs/toolkit'
import storesReducer from '../features/stores/storesSlice'

export const store = configureStore({
  reducer: {
    stores: storesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
