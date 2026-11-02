import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { detailKey, fetchStore } from '@/features/store/storeSlice'
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
          <div className="box mt" role="alert">
            <h3>Could not load store #{code}</h3>
            <p>{entry.error}</p>
            <button type="button" className="mt-2 font-bold text-brand underline" onClick={() => void dispatch(fetchStore({ code, key }))}>
              Try again
            </button>
          </div>
        ) : (
          <div className="box mt" aria-busy="true">
            <h3>Loading store #{code}</h3>
            <p>Reading this store's numbers from the database.</p>
          </div>
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
