import { useEffect } from 'react'
import { RiMapPin2Line, RiStore2Line } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import FilterSelect from '@/components/ui/FilterSelect'
import { selectCityStores } from '@/features/dashboard/selectors'
import { fetchFilterOptions, setCity, setStore } from '@/features/filters/filtersSlice'

/** City and store filters floating on the map. They share the app-wide City filter held in Redux. */
export default function MapFilters() {
  const dispatch = useAppDispatch()
  const { city, store, options } = useAppSelector((s) => s.filters)
  const stores = useAppSelector(selectCityStores)

  useEffect(() => {
    if (options.cities.length < 2) void dispatch(fetchFilterOptions()) // opened directly on the Network page
  }, [dispatch, options.cities.length])

  const cityName = options.cities.find((c) => c.code === city)?.name
  const allStores = 'All stores'
  const label = (w: { id: string; name: string }) => `${w.id} · ${w.name}`
  const current = stores.find((w) => w.id === store)

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
      <FilterSelect
        key={`city-${options.cities.length}-${city}`}
        label="Map city"
        icon={RiMapPin2Line}
        options={options.cities.map((c) => c.name)}
        defaultValue={cityName}
        onChange={(name) => dispatch(setCity(options.cities.find((c) => c.name === name)?.code ?? 'all'))}
      />
      <FilterSelect
        key={`store-${city}-${stores.length}`}
        label="Map store"
        icon={RiStore2Line}
        options={[allStores, ...stores.map(label)]}
        defaultValue={current ? label(current) : allStores}
        onChange={(v) => dispatch(setStore(v === allStores ? 'all' : (stores.find((w) => label(w) === v)?.id ?? 'all')))}
      />
    </div>
  )
}
