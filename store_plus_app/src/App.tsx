import { Navigate, Route, Routes } from 'react-router-dom'
import AppSidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import Overview from './screens/Overview'
import Utilisation from './screens/Utilisation'
import Inventory from './screens/Inventory'
import Operations from './screens/Operations'
import Profitability from './screens/Profitability'
import Network from './screens/Network'
import ProductMix from './screens/ProductMix'
import StoreDetail from './screens/StoreDetail'
import Transfers from './screens/Transfers'
import Pulse from './screens/Pulse'

export default function App() {
  useScrollToTop()
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Topbar />
          <div className="page">
            <Routes>
              <Route path="/overview" element={<Overview />} />
              <Route path="/utilisation" element={<Utilisation />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/profitability" element={<Profitability />} />
              <Route path="/network" element={<Network />} />
              <Route path="/productmix" element={<ProductMix />} />
              <Route path="/store/:code" element={<StoreDetail />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
