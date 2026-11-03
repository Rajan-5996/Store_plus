import { RIVAL_KM } from '@/data/competitors'
import BrandMark from '@/components/map/BrandMark'
import type { WarehouseApi } from '@/types/api'

/** Competitor stores within reach of the selected store, nearest first (also linked to it on the map). */
export default function NearbyRivals({ rivals }: { rivals: WarehouseApi['rivals'] }) {
  const nearest = rivals[0]
  return (
    <>
      <h4 className="rec-section">Competitors within {RIVAL_KM} km</h4>
      <p className="mb-2 text-[13px] text-muted">
        {nearest
          ? `${rivals.length} rival ${rivals.length === 1 ? 'store' : 'stores'}; the nearest is ${nearest.brand}, ${nearest.km} km away.`
          : `No competitor store within ${RIVAL_KM} km.`}
      </p>
      {rivals.length > 0 && (
        <ul className="mb-4 flex list-none flex-wrap gap-1.5 !p-0">
          {rivals.map((r) => (
            <li key={r.id} className="rec-row flex items-center gap-1.5 px-2 py-1 text-[12.5px]">
              <BrandMark brand={r.brand} />
              <b>{r.brand}</b>
              <span className="text-muted">{r.km} km</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
