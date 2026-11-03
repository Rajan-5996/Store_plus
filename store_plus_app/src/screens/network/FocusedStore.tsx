import { RiCloseLine, RiLoader4Line } from '@remixicon/react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { detailKey, fetchStore } from '@/features/store/storeSlice'
import { setFocus } from '@/features/filters/filtersSlice'
import { useActions } from '@/hooks/useActions'
import type { Warehouse } from '@/data/warehouses'
import ActionsList, { RefreshButton, isLoading } from '../../components/ui/ActionsList'
import AiBadge from '../../components/ui/AiBadge'
import Box from '../../components/ui/Box'
import Pill from '../../components/ui/Pill'
import StoreLink from '../../components/ui/StoreLink'
import Emphasis from '../../components/ui/Emphasis'
import NearbyRivals from './NearbyRivals'
import RebalanceList from './RebalanceList'
import ReplenishList from './ReplenishList'
import StoreStats from './StoreStats'
import { verdict } from './verdict'

const STATUS = { profit: ['green', 'Profitable'], mid: ['warn', 'Near break-even'], loss: ['red', 'Losing money'] } as const

/** The selected store: its numbers, the from → to rebalancing moves and the agent's recommended actions. */
export default function FocusedStore({ w }: { w: Warehouse }) {
  const dispatch = useAppDispatch()
  const code = w.id.replace(/\D/g, '')
  const { entry, reload, retry } = useActions(`store:${code}`)
  const [variant, label] = STATUS[w.status]
  const range = useAppSelector((s) => s.filters.range)
  const key = detailKey(code, range)
  const detail = useAppSelector((s) => s.store.details[key])
  useEffect(() => {
    if (!detail) void dispatch(fetchStore({ code, key }))
  }, [dispatch, code, key, detail])
  const d = detail?.data
  const actions = (
    <>
      <RefreshButton loading={isLoading(entry)} onClick={reload} />
      <button
        type="button"
        className="rec-icon-btn"
        onClick={() => dispatch(setFocus(null))}
        aria-label="Close store recommendations"
        title="Close"
      >
        <RiCloseLine className="size-4" aria-hidden />
      </button>
    </>
  )
  return (
    <Box title={`${w.id} · ${w.name}`} actions={actions} className="rec-box fill-col">
      <div className="fill-scroll">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <Pill variant={variant}>{label}</Pill>
          <StoreLink code={w.id}>Open full store page</StoreLink>
        </div>
        {d ? (
          <>
            <p className="rec-verdict">
              <Emphasis text={verdict(d)} />
            </p>
            <StoreStats d={d} />
          </>
        ) : (
          <p className="mb-4 flex items-center gap-2 text-[13px] text-muted" role="status">
            <RiLoader4Line className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading this store's numbers…
          </p>
        )}
        <NearbyRivals rivals={w.rivals} />
        <RebalanceList code={code} onPick={(c) => dispatch(setFocus(c))} />
        <ReplenishList code={code} />
        <h4 className="rec-section mt-5 flex items-center gap-2">
          What to do next <AiBadge />
        </h4>
        <ActionsList entry={entry} retry={retry} limit={3} />
      </div>
    </Box>
  )
}
