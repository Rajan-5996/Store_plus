import type { ReactNode } from 'react'
import { useScreen } from '@/hooks/useScreen'
import type { ScreenMap, ScreenName } from '@/types/api'

interface Props<K extends ScreenName> {
  name: K
  children: (data: ScreenMap[K]) => ReactNode
}

/** Loads a screen's data from the backend (via Redux) and renders its content, or a loading / error state. */
export default function ScreenData<K extends ScreenName>({ name, children }: Props<K>) {
  const { data, status, error } = useScreen(name)
  if (data) {
    return <div className={status === 'loading' ? 'opacity-70 transition-opacity' : 'transition-opacity'}>{children(data)}</div>
  }
  if (status === 'error') {
    return (
      <div className="box" role="alert">
        <h3>Could not load data</h3>
        <p>{error}. Make sure the API server is running on port 8000.</p>
      </div>
    )
  }
  return (
    <div className="box" aria-busy="true">
      <h3>Loading data</h3>
      <p>Reading the latest numbers from the store database.</p>
    </div>
  )
}
