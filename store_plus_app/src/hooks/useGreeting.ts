import { useEffect, useState } from 'react'

export type DayPeriod = 'morning' | 'afternoon' | 'evening'

export const periodOf = (date: Date): DayPeriod => {
  const h = date.getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

/** Current period of day (morning / afternoon / evening); re-checks every minute. */
export function useGreeting(): DayPeriod {
  const [period, setPeriod] = useState<DayPeriod>(() => periodOf(new Date()))

  useEffect(() => {
    const id = setInterval(() => setPeriod(periodOf(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])

  return period
}
