import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { detailKey, fetchReplenishment } from '@/features/store/storeSlice'

/** A store's replenishment-timing plan (loaded once per store and date range). */
export function useReplenishment(code: string) {
  const dispatch = useAppDispatch()
  const range = useAppSelector((s) => s.filters.range)
  const key = detailKey(code, range)
  const entry = useAppSelector((s) => s.store.replenish[key])
  useEffect(() => {
    if (!entry) void dispatch(fetchReplenishment({ code, key }))
  }, [dispatch, code, key, entry])
  return entry
}
