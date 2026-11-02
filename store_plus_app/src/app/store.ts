import { configureStore } from '@reduxjs/toolkit'
import actionsReducer from '../features/agent/actionsSlice'
import chatReducer from '../features/chat/chatSlice'
import storeReducer from '../features/store/storeSlice'
import transfersReducer from '../features/transfers/transfersSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import filtersReducer from '../features/filters/filtersSlice'

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    dashboard: dashboardReducer,
    chat: chatReducer,
    actions: actionsReducer,
    store: storeReducer,
    transfers: transfersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
