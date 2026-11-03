import type { ReactNode } from 'react'
import PageFilters from '@/components/layout/PageFilters'

interface Props {
  title: ReactNode
  sub: ReactNode
  /** Which shared filters the page responds to: City + Date range (default), Date range only, or none. */
  filters?: 'all' | 'range' | 'none'
}

/** Page title block: title, one-line purpose and the shared filters on the right. */
export default function ScreenHeader({ title, sub, filters = 'all' }: Props) {
  return (
    <header className="page-head">
      <div className="min-w-0 flex-1 basis-96">
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
      </div>
      {filters !== 'none' && <PageFilters city={filters === 'all'} />}
    </header>
  )
}
