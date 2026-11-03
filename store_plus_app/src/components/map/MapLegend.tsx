import { useAppSelector } from '@/app/hooks'
import { selectMapCompetitors, selectMapWarehouses } from '@/features/dashboard/selectors'
import { STATUS_COLORS, STATUS_LABELS, type WarehouseStatus } from '@/data/warehouses'
import BrandMark from './BrandMark'

const STATUSES: WarehouseStatus[] = ['profit', 'mid', 'loss']

interface Props {
  rivalsShown: boolean
  onToggleRivals: () => void
}

/** Above the map: what it shows (city, stores, competitors), the pin colours and the competitor on/off switch. */
export default function MapLegend({ rivalsShown, onToggleRivals }: Props) {
  const stores = useAppSelector(selectMapWarehouses)
  const rivals = useAppSelector(selectMapCompetitors)
  const regions = new Set(stores.map((w) => w.city))
  const label = regions.size === 1 ? stores[0].city : `${regions.size} cities`
  const brands = [...new Set(rivals.map((c) => c.brand))]

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold">
      {stores.length > 0 && (
        <span className="font-extrabold">
          {label} · {stores.length} {stores.length === 1 ? 'store' : 'stores'} · {rivals.length} competitors
        </span>
      )}
      {STATUSES.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
          {STATUS_LABELS[s]}
        </span>
      ))}
      <button
        type="button"
        aria-pressed={rivalsShown}
        onClick={onToggleRivals}
        title={rivalsShown ? 'Hide competitor stores' : 'Show competitor stores'}
        className={`flex cursor-pointer items-center gap-1.5 rounded-full border border-line-soft px-2.5 py-0.5 font-semibold hover:bg-salt ${rivalsShown ? '' : 'text-muted'}`}
      >
        <i className="inline-block size-2.5 rotate-45 rounded-[2px] border-[1.5px] border-current" />
        Competitor stores
        <span className="text-muted">· {rivalsShown ? 'Hide' : 'Show'}</span>
      </button>
      {rivalsShown && brands.length > 0 && (
        <div className="flex basis-full flex-wrap gap-x-3 gap-y-1">
          {brands.map((b) => (
            <span key={b} className="flex items-center gap-1.5">
              <BrandMark brand={b} />
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
