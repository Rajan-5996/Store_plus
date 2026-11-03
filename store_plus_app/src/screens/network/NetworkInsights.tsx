import { RiCursorLine } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAllWarehouses, selectCityStores } from '@/features/dashboard/selectors'
import { setFocus } from '@/features/filters/filtersSlice'
import { rupee } from '@/lib/format'
import Box from '../../components/ui/Box'
import FocusedStore from './FocusedStore'

/** Right of the map: pick a store to get its recommendations and rebalancing moves (from → to). */
export default function NetworkInsights() {
  const dispatch = useAppDispatch()
  const focus = useAppSelector((s) => s.filters.focus)
  const all = useAppSelector(selectAllWarehouses)
  const cityStores = useAppSelector(selectCityStores)
  const w = all.find((x) => x.id === focus)
  if (w) return <FocusedStore w={w} />

  const worst = [...cityStores].sort((a, b) => a.pnlDay - b.pnlDay).slice(0, 5)
  return (
    <Box title="Store recommendations" sub="Pick a store on the map or from the list below." className="rec-box fill-col">
      <div className="fill-scroll">
        <p className="flex items-start gap-2 text-[13px] text-muted">
          <RiCursorLine className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          Click a store pin on the map. Pulse will write recommendations for that store and suggest which nearby store should send demand,
          stock or staff hours to which, drawn as lines on the map.
        </p>
        {worst.length > 0 && (
          <>
            <h4 className="mb-2 mt-4 text-[13px] font-extrabold uppercase tracking-wide text-muted">Weakest stores here</h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 !p-0">
              {worst.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="rec-row flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]"
                    onClick={() => dispatch(setFocus(s.id))}
                  >
                    <span>
                      <b>{s.id}</b> {s.name}
                    </span>
                    <span className="font-bold text-loss">{rupee(s.pnlDay)}/day</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Box>
  )
}
