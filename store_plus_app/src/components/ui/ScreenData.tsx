import type { ReactNode } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { fetchScreen } from '@/features/dashboard/dashboardSlice'
import { useScreen } from '@/hooks/useScreen'
import type { ScreenMap, ScreenName } from '@/types/api'
import ErrorState from './ErrorState'
import PageSkeleton from './PageSkeleton'

interface Props<K extends ScreenName> {
  name: K
  children: (data: ScreenMap[K]) => ReactNode
}

/** Loads a screen's data from the backend (via Redux) and renders its content, or a loading skeleton / error card. */
export default function ScreenData<K extends ScreenName>({ name, children }: Props<K>) {
  const dispatch = useAppDispatch()
  const { data, status, error } = useScreen(name)
  if (data) {
    return <div className={status === 'loading' ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children(data)}</div>
  }
  if (status === 'error') {
    return <ErrorState title="Could not load this page" message={error} onRetry={() => void dispatch(fetchScreen(name))} />
  }
  return <PageSkeleton />
}
