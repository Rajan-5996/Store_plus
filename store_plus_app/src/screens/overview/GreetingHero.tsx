import { useEffect } from 'react'
import { RiCalendarLine, RiMapPin2Line, RiMoonClearLine, RiSunFoggyLine, RiSunLine } from '@remixicon/react'
import FilterSelect from '@/components/ui/FilterSelect'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchFilterOptions, setCity, setRange } from '@/features/filters/filtersSlice'
import { useGreeting, type DayPeriod } from '@/hooks/useGreeting'
import { USER_NAME } from '../../data/user'
import HeroArt from './HeroArt'

const copy: Record<DayPeriod, { icon: typeof RiSunLine; hello: string; line: string }> = {
  morning: {
    icon: RiSunFoggyLine,
    hello: 'Good morning',
    line: 'Hope your day is off to a great start. Here is how your dark-store network is shaping up this morning.',
  },
  afternoon: {
    icon: RiSunLine,
    hello: 'Good afternoon',
    line: 'Hope the day is going well. Here is a quick look at utilisation, inventory, operations and profitability across your stores.',
  },
  evening: {
    icon: RiMoonClearLine,
    hello: 'Good evening',
    line: 'Hope you had a productive day. Here is how your dark-store network performed and where to focus next.',
  },
}

export default function GreetingHero() {
  const { icon: Icon, hello, line } = copy[useGreeting()]
  const dispatch = useAppDispatch()
  const { city, range, options } = useAppSelector((s) => s.filters)

  useEffect(() => {
    void dispatch(fetchFilterOptions())
  }, [dispatch])

  const cityName = options.cities.find((c) => c.code === city)?.name
  const rangeLabel = options.ranges.find((r) => r.key === range)?.label

  return (
    <section className="hero">
      <HeroArt />
      <div className="hero-body">
        <div className="min-w-0 flex-1 basis-80">
          <h1 className="hero-title">
            <Icon className="size-8 shrink-0 text-brand" aria-hidden />
            {hello}, {USER_NAME}
          </h1>
          <p className="sub !mb-0">{line}</p>
        </div>
        <div className="hero-filters">
          {/* keyed on the loaded options so the dropdown shows the real city / range names */}
          <FilterSelect
            key={`c-${options.cities.length}`}
            label="City"
            icon={RiMapPin2Line}
            options={options.cities.map((c) => c.name)}
            defaultValue={cityName}
            onChange={(name) => dispatch(setCity(options.cities.find((c) => c.name === name)?.code ?? 'all'))}
          />
          <FilterSelect
            key={`r-${options.ranges.length}`}
            label="Date range"
            icon={RiCalendarLine}
            options={options.ranges.map((r) => r.label)}
            defaultValue={rangeLabel}
            onChange={(label) => dispatch(setRange(options.ranges.find((r) => r.label === label)?.key ?? '30d'))}
          />
        </div>
      </div>
    </section>
  )
}
