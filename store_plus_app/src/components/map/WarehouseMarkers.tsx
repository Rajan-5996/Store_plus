import { Link } from 'react-router-dom'
import { storePath } from '@/lib/storePath'
import { MapMarker, MarkerContent, MarkerPopup, useMap } from '@/components/ui/map'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setFocus } from '@/features/filters/filtersSlice'
import { selectAllWarehouses } from '@/features/dashboard/selectors'
import { STATUS_COLORS } from '@/data/warehouses'
import { RIVAL_KM } from '@/data/competitors'
import { rupee } from '@/lib/format'
import { flyToWarehouse } from './flyToWarehouse'

/** Store pins with a details popup; clicking a pin also flies the camera to that warehouse. */
export default function WarehouseMarkers() {
  const { map } = useMap()
  const warehouses = useAppSelector(selectAllWarehouses)
  const focus = useAppSelector((s) => s.filters.focus)
  const dispatch = useAppDispatch()
  return (
    <>
      {warehouses.map((w) => (
        <MapMarker key={w.id} className="z-2" longitude={w.lng} latitude={w.lat} onClick={() => (focus === w.id ? map && flyToWarehouse(map, w) : dispatch(setFocus(w.id)))}>
          <MarkerContent>
            <div
              className={`translate-y-8 cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-tight text-[#FFF4EC] shadow-md ${focus === w.id ? 'outline-2 outline-offset-2 outline-[#2A2118]' : ''}`}
              style={{ background: STATUS_COLORS[w.status] }}
            >
              {w.id}
            </div>
          </MarkerContent>
          <MarkerPopup className="w-56">
            <div className="space-y-1 text-sm">
              <div className="font-extrabold">
                {w.id} · {w.name}
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Orders/day</span>
                <b className="text-foreground">{w.orders}</b>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Daily P&amp;L</span>
                <b style={{ color: STATUS_COLORS[w.status] }}>{rupee(w.pnlDay)}/day</b>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Competitors within {RIVAL_KM} km</span>
                <b className="text-foreground">{w.rivals.length}</b>
              </div>
              <div className="text-xs text-muted-foreground">{w.note}</div>
              <Link to={storePath(w.id)} className="inline-block pt-1 text-xs font-bold text-brand hover:underline">
                View store details
              </Link>
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </>
  )
}
