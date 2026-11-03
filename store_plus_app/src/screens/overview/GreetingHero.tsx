import { RiMoonClearLine, RiSunFoggyLine, RiSunLine } from '@remixicon/react'
import PageFilters from '@/components/layout/PageFilters'
import { useGreeting, type DayPeriod } from '@/hooks/useGreeting'
import { USER_NAME } from '../../data/user'

const copy: Record<DayPeriod, { icon: typeof RiSunLine; hello: string }> = {
  morning: { icon: RiSunFoggyLine, hello: 'Good morning' },
  afternoon: { icon: RiSunLine, hello: 'Good afternoon' },
  evening: { icon: RiMoonClearLine, hello: 'Good evening' },
}

/** Overview page header: greeting, what the page answers, and the shared City / Date-range filters. */
export default function GreetingHero() {
  const { icon: Icon, hello } = copy[useGreeting()]
  return (
    <header className="hero">
      <div className="hero-body">
        <div className="min-w-0 flex-1 basis-96">
          <h1 className="hero-title">
            <Icon className="size-7 shrink-0 text-brand" aria-hidden />
            {hello}, {USER_NAME}
          </h1>
          <p className="sub">How the dark-store network is performing, where money is being lost, and which stores to look at first.</p>
        </div>
        <PageFilters />
      </div>
    </header>
  )
}
