import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Every navigation starts at the top of the new page. */
export function useScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
}
