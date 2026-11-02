import { RiArrowLeftLine } from '@remixicon/react'
import { useNavigate } from 'react-router-dom'
import Pill from '../../components/ui/Pill'
import type { StoreDetail } from '../../types/store'

const STATUS = {
  profit: ['green', 'Profitable'],
  mid: ['high', 'Near break-even'],
  loss: ['red', 'Losing money'],
} as const

export default function StoreHeader({ code, d }: { code: string; d?: StoreDetail }) {
  const navigate = useNavigate()
  const [variant, label] = d ? STATUS[d.store.status] : ['', '']
  return (
    <>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-2 inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:underline"
      >
        <RiArrowLeftLine className="size-4" aria-hidden /> Back
      </button>
      <h1 className="flex flex-wrap items-center gap-3">
        {d ? `${d.store.code} · ${d.store.area}` : `#${code}`}
        {d && <Pill variant={variant as 'green' | 'high' | 'red'}>{label}</Pill>}
      </h1>
      {d && (
        <p className="sub">
          {d.store.city} · {d.store.format} format · {d.store.areaSqft.toLocaleString('en-IN')} sq ft · opened {d.store.launchDate} ·
          showing {d.range.start} to {d.range.end} ({d.range.days} days)
        </p>
      )}
    </>
  )
}
