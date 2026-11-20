import { configureStore } from '@reduxjs/toolkit'
import actionsReducer from '../features/agent/actionsSlice'
import chatReducer, { openThread } from '../features/chat/chatSlice'
import historyReducer from '../features/chat/historySlice'
import { readLastThread, rememberThread } from '../features/chat/lastThread'
import storeReducer from '../features/store/storeSlice'
import transfersReducer from '../features/transfers/transfersSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import filtersReducer from '../features/filters/filtersSlice'

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    dashboard: dashboardReducer,
    chat: chatReducer,
    history: historyReducer,
    actions: actionsReducer,
    store: storeReducer,
    transfers: transfersReducer,
  },
})

// bring back the Pulse conversation that was open before the page reloaded, then remember whichever one is open
const last = readLastThread()
if (last) void store.dispatch(openThread(last))
let remembered = ''
const remember = () => {
  const id = store.getState().chat.threadId
  if (id !== remembered) rememberThread((remembered = id))
}
remember()
store.subscribe(remember)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
