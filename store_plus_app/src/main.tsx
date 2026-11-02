import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './app/store'
import { UIProvider } from './context/UIContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <UIProvider>
          <App />
        </UIProvider>
      </HashRouter>
    </Provider>
  </StrictMode>,
)
