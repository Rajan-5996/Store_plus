import { MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setFocus } from '@/features/filters/filtersSlice'
import { selectAllWarehouses, selectMapCompetitors } from '@/features/dashboard/selectors'
import Pill from '@/components/ui/Pill'
import { longDate } from '@/lib/format'
import BrandMark from './BrandMark'

/** Competitor dark stores as diamonds in their brand colours; with a store selected, its rivals within reach stay bold and the rest fade. */
export default function CompetitorMarkers() {
  const dispatch = useAppDispatch()
  const competitors = useAppSelector(selectMapCompetitors)
  const focus = useAppSelector((s) => s.filters.focus)
  const focused = useAppSelector(selectAllWarehouses).find((w) => w.id === focus)
  const near = focused && new Set(focused.rivals.map((r) => r.id))

  return (
    <>
      {competitors.map((c) => (
        <MapMarker key={c.id} className="z-1" longitude={c.lng} latitude={c.lat}>
          <MarkerContent>
            <div className={`transition-opacity ${near && !near.has(c.id) ? 'opacity-30' : ''}`} aria-label={`${c.brand} competitor store`}>
              <BrandMark brand={c.brand} pin />
            </div>
          </MarkerContent>
          <MarkerPopup className="w-56">
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2 font-extrabold">
                <span className="flex items-center gap-1.5">
                  <BrandMark brand={c.brand} />
                  {c.brand}
                </span>
                {c.isNew && <Pill variant="warn">New</Pill>}
              </div>
              <div className="text-xs text-muted-foreground">Competitor store · opened {longDate(c.opened)}</div>
              {c.near && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Nearest Swiggy store</span>
                    <b className="text-foreground">{c.near.id}</b>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{c.near.name}</span>
                    <b className="text-foreground">{c.near.km} km away</b>
                  </div>
                  <button
                    type="button"
                    className="inline-block pt-1 text-xs font-bold text-brand hover:underline"
                    onClick={() => c.near && dispatch(setFocus(c.near.id))}
                  >
                    Select {c.near.id} on the map
                  </button>
                </>
              )}
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </>
  )
}
