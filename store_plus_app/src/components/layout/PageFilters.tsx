import { useEffect } from 'react'
import { RiCalendarLine, RiMapPin2Line } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import FilterSelect from '@/components/ui/FilterSelect'
import { fetchFilterOptions, setCity, setRange } from '@/features/filters/filtersSlice'
import DataAsOf from './DataAsOf'

/** City and Date-range filters plus the data date, shown in every page header. The values live in Redux, so all pages share them. */
export default function PageFilters({ city: showCity = true }: { city?: boolean }) {
  const dispatch = useAppDispatch()
  const { city, range, options } = useAppSelector((s) => s.filters)

  useEffect(() => {
    if (!options.dataRange) void dispatch(fetchFilterOptions())
  }, [dispatch, options.dataRange])

  const cityName = options.cities.find((c) => c.code === city)?.name
  const rangeLabel = options.ranges.find((r) => r.key === range)?.label

  return (
    <div className="page-filters">
      <DataAsOf />
      {showCity && (
        <FilterSelect
          label="City"
          icon={RiMapPin2Line}
          options={options.cities.map((c) => c.name)}
          value={cityName}
          onChange={(name) => dispatch(setCity(options.cities.find((c) => c.name === name)?.code ?? 'all'))}
        />
      )}
      <FilterSelect
        label="Date range"
        icon={RiCalendarLine}
        options={options.ranges.map((r) => r.label)}
        value={rangeLabel}
        onChange={(label) => dispatch(setRange(options.ranges.find((r) => r.label === label)?.key ?? '30d'))}
      />
    </div>
  )
}
