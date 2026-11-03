import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { detailKey, fetchStore } from '@/features/store/storeSlice'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import StoreCosts from './store/StoreCosts'
import StoreCompare from './store/StoreCompare'
import StoreHeader from './store/StoreHeader'
import StoreHero from './store/StoreHero'
import StoreKpis from './store/StoreKpis'
import StoreNearby from './store/StoreNearby'
import StoreReplenish from './store/StoreReplenish'
import StoreStock from './store/StoreStock'
import StoreTrend from './store/StoreTrend'

/** One store in depth: economics, trend, costs, capacity, funnel, stock, mix, neighbours and the agent's actions. */
export default function StoreDetail() {
  const code = (useParams().code ?? '').replace(/\D/g, '')
  const dispatch = useAppDispatch()
  const range = useAppSelector((s) => s.filters.range)
  const key = detailKey(code, range)
  const entry = useAppSelector((s) => s.store.details[key])

  useEffect(() => {
    if (!entry) void dispatch(fetchStore({ code, key }))
  }, [dispatch, code, key, entry])

  const d = entry?.data
  if (!d) {
    return (
      <section>
        <StoreHeader code={code} />
        {entry?.status === 'error' ? (
          <ErrorState title={`Could not load store #${code}`} message={entry.error} onRetry={() => void dispatch(fetchStore({ code, key }))} />
        ) : (
          <PageSkeleton />
        )}
      </section>
    )
  }
  return (
    <section>
      <StoreHeader code={code} d={d} />
      <StoreKpis d={d} />
      <StoreHero d={d} code={code} />
      <StoreReplenish code={code} />
      <StoreTrend d={d} />
      <StoreCosts d={d} />
      <StoreStock d={d} />
      <StoreCompare d={d} />
      <StoreNearby d={d} />
    </section>
  )
}
