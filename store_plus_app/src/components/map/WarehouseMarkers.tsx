import { MapMarker, MarkerContent, MarkerPopup, useMap } from '@/components/ui/map'
import { STATUS_COLORS, warehouses } from '@/data/warehouses'
import { flyToWarehouse } from './flyToWarehouse'

/** Store pins with a details popup; clicking a pin also flies the camera to that warehouse. */
export default function WarehouseMarkers() {
  const { map } = useMap()
  return (
    <>
      {warehouses.map((w) => (
        <MapMarker key={w.id} longitude={w.lng} latitude={w.lat} onClick={() => map && flyToWarehouse(map, w)}>
          <MarkerContent>
            <div
              className="translate-y-8 cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-tight text-[#FFF4EC] shadow-md"
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
                <b style={{ color: STATUS_COLORS[w.status] }}>{w.pnl}</b>
              </div>
              <div className="text-xs text-muted-foreground">{w.note}</div>
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </>
  )
}
