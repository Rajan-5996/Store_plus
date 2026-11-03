import { RiArrowLeftLine } from '@remixicon/react'
import { useNavigate } from 'react-router-dom'
import PageFilters from '../../components/layout/PageFilters'
import Pill from '../../components/ui/Pill'
import type { StoreDetail } from '../../types/store'

const STATUS = {
  profit: ['green', 'Profitable'],
  mid: ['warn', 'Near break-even'],
  loss: ['red', 'Losing money'],
} as const

export default function StoreHeader({ code, d }: { code: string; d?: StoreDetail }) {
  const navigate = useNavigate()
  const [variant, label] = d ? STATUS[d.store.status] : ['', '']
  return (
    <header className="page-head">
      <div className="min-w-0 flex-1 basis-96">
        <button type="button" onClick={() => navigate(-1)} className="eyebrow inline-flex items-center gap-1 border-0 bg-transparent p-0 hover:underline">
          <RiArrowLeftLine className="size-4" aria-hidden /> Back
        </button>
        <h1 className="flex flex-wrap items-center gap-3">
          {d ? `${d.store.code} · ${d.store.area}` : `Store #${code}`}
          {d && <Pill variant={variant as 'green' | 'warn' | 'red'}>{label}</Pill>}
        </h1>
        {d && (
          <p className="sub">
            {d.store.city} · {d.store.format} format · {d.store.areaSqft.toLocaleString('en-IN')} sq ft · opened {d.store.launchDate} · showing{' '}
            {d.range.start} to {d.range.end} ({d.range.days} days)
          </p>
        )}
      </div>
      <PageFilters city={false} />
    </header>
  )
}
