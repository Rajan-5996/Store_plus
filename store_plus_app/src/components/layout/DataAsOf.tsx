import { useAppSelector } from '@/app/hooks'
import { longDate } from '@/lib/format'

/** "Data through 31 Oct 2026": the last day in the dataset, so every number on screen has a date. */
export default function DataAsOf({ className = 'as-of' }: { className?: string }) {
  const end = useAppSelector((s) => s.filters.options.dataRange?.end)
  if (!end) return null
  return (
    <span className={className} title="Every range ends on the last day of data">
      <i aria-hidden />
      Data through {longDate(end)}
    </span>
  )
}
