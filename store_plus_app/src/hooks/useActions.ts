import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { actionsKey, fetchActions, selectActions } from '@/features/agent/actionsSlice'

/** The agent's recommended actions for a screen ("utilisation") or a store ("store:524"), loaded once per filter set. */
export function useActions(scope: string) {
  const dispatch = useAppDispatch()
  const city = useAppSelector((s) => s.filters.city)
  const range = useAppSelector((s) => s.filters.range)
  const key = actionsKey(scope, city, range)
  const entry = useAppSelector(selectActions(key))
  const status = entry?.status

  const load = useCallback(
    (refresh = false) => void dispatch(fetchActions({ scope, key, refresh })),
    [dispatch, scope, key],
  )

  useEffect(() => {
    if (status === undefined) load() // a failed load is retried by the user, not in a loop
  }, [status, load])

  return { entry, reload: () => load(true), retry: () => load(false) }
}
