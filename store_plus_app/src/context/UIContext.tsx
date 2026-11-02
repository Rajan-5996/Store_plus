import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface UIContextValue {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  // The drawer is tied to the route it was opened on, so navigating closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const { pathname } = useLocation()

  const drawerOpen = openedAt === pathname
  const openDrawer = useCallback(() => setOpenedAt(pathname), [pathname])
  const closeDrawer = useCallback(() => setOpenedAt(null), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const value = useMemo(
    () => ({ drawerOpen, openDrawer, closeDrawer }),
    [drawerOpen, openDrawer, closeDrawer],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}
