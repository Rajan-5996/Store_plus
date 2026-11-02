import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchScreen } from '@/features/dashboard/dashboardSlice'
import type { ScreenMap, ScreenName } from '@/types/api'

/** Fetch a screen's backend data on mount and whenever the City / Date-range filters change. */
export function useScreen<K extends ScreenName>(name: K) {
  const dispatch = useAppDispatch()
  const city = useAppSelector((s) => s.filters.city)
  const range = useAppSelector((s) => s.filters.range)
  const entry = useAppSelector((s) => s.dashboard[name])

  useEffect(() => {
    void dispatch(fetchScreen(name))
  }, [dispatch, name, city, range])

  return entry as { data: ScreenMap[K] | null; status: string; error: string | null }
}
