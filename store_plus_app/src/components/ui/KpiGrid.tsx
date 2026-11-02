import type { ComponentType } from 'react'
import Kpi, { type KpiProps } from './Kpi'

interface Props {
  items: KpiProps[]
  /** Icons aligned with `items` by index. */
  icons?: ComponentType<{ className?: string }>[]
  cols?: 3 | 4
}

export default function KpiGrid({ items, icons, cols = 4 }: Props) {
  return (
    <div className={`grid g${cols}`}>
      {items.map((k, i) => (
        <Kpi key={i} accent={i} icon={icons?.[i]} {...k} />
      ))}
    </div>
  )
}
