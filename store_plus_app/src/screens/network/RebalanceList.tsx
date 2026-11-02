import { RiArrowRightLine, RiBox3Line, RiCheckLine, RiLoader4Line, RiPlayListAddLine, RiShoppingBag3Line, RiTeamLine } from '@remixicon/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { detailKey, fetchRebalance } from '@/features/store/storeSlice'
import { entryKey, fetchTransfers, logTransfer, moveKey } from '@/features/transfers/transfersSlice'
import { fmt } from '@/lib/format'
import type { RebalanceEnd, RebalanceMove } from '@/types/store'
import Emphasis from '../../components/ui/Emphasis'

const KIND_LABEL = { Demand: 'Move orders', Stock: 'Move stock', Staff: 'Move staff hours' } as const

function End({ e, side, onPick }: { e: RebalanceEnd; side: 'from' | 'to'; onPick: (code: string) => void }) {
  return (
    <button type="button" className={`rec-${side} flex-1`} onClick={() => onPick(e.code)}>
      {e.code}
      <small>
        {e.area}
        {e.km > 0 && ` · ${e.km} km away`}
      </small>
    </button>
  )
}

function LogButton({ m }: { m: RebalanceMove }) {
  const dispatch = useAppDispatch()
  const logged = useAppSelector((s) => s.transfers.items.some((e) => e.status !== 'cancelled' && entryKey(e) === moveKey(m)))
  return logged ? (
    <Link to="/transfers" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-gain hover:underline">
      <RiCheckLine className="size-4" aria-hidden /> In the transfer log
    </Link>
  ) : (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-full bg-cool px-3 py-1 text-[12.5px] font-bold text-brand-ink hover:opacity-90"
      onClick={() => void dispatch(logTransfer(m))}
    >
      <RiPlayListAddLine className="size-4" aria-hidden /> Log this transfer
    </button>
  )
}

const ACCENT = {
  Demand: { cls: 'kpi-c1', Icon: RiShoppingBag3Line },
  Stock: { cls: 'kpi-c2', Icon: RiBox3Line },
  Staff: { cls: 'kpi-c6', Icon: RiTeamLine },
} as const

function Move({ m, onPick }: { m: RebalanceMove; onPick: (code: string) => void }) {
  const { cls, Icon } = ACCENT[m.kind]
  return (
    <li className={`box kpi kpi-c ${cls} rec-kcard`}>
      <div className="kpi-head">
        <div className="label">{KIND_LABEL[m.kind]}</div>
        <span className="kpi-ico">
          <Icon />
        </span>
      </div>
      <div className="val">
        {fmt(m.amount)} {m.unit}
      </div>
      {m.item && <div className="mt-0.5 text-[14px] font-bold">{m.item}</div>}
      <div className="mt-2.5 flex items-center gap-2">
        <End e={m.from} side="from" onPick={onPick} />
        <span className="rec-arrow" aria-label="to">
          <RiArrowRightLine className="size-4" aria-hidden />
        </span>
        <End e={m.to} side="to" onPick={onPick} />
      </div>
      <div className="mt-3 text-[12px] font-extrabold uppercase tracking-wide text-muted">Why move it</div>
      <div className="delta !mt-1">
        <Emphasis text={m.reason} />
      </div>
      {m.facts?.length > 0 && (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {m.facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11.5px] font-semibold text-muted">{label}</dt>
              <dd className="m-0 text-[13px] font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3">
        <LogButton m={m} />
      </div>
    </li>
  )
}

/** Suggested from → to moves around the selected store (demand, stock and staff hours), computed from the data. */
export default function RebalanceList({ code, onPick }: { code: string; onPick: (code: string) => void }) {
  const dispatch = useAppDispatch()
  const range = useAppSelector((s) => s.filters.range)
  const key = detailKey(code, range)
  const entry = useAppSelector((s) => s.store.rebalance[key])
  const logStatus = useAppSelector((s) => s.transfers.status)

  useEffect(() => {
    if (!entry) void dispatch(fetchRebalance({ code, key }))
  }, [dispatch, code, key, entry])

  useEffect(() => {
    if (logStatus === 'idle') void dispatch(fetchTransfers()) // so cards know which moves are already logged
  }, [dispatch, logStatus])

  return (
    <section aria-label="Rebalancing">
      <h4 className="rec-section">Move between stores</h4>
      <p className="mb-2 text-[12px] text-muted">
        <span className="font-bold text-brand">Orange</span> sends, <span className="font-bold text-cool-text">blue</span> receives. Click a store to open it.
      </p>
      {(!entry || entry.status === 'loading') && !entry?.data && (
        <p className="flex items-center gap-2 text-[13px] text-muted" role="status">
          <RiLoader4Line className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Checking capacity, stock and staffing of nearby stores…
        </p>
      )}
      {entry?.status === 'error' && <p className="text-[13px] text-brand">{entry.error}</p>}
      {entry?.data && entry.data.moves.length === 0 && (
        <p className="text-[13px] text-muted">
          No rebalancing is needed: no store within {entry.data.radiusKm} km has a capacity, stock or staffing imbalance with this one.
        </p>
      )}
      {entry?.data && entry.data.moves.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-3 !p-0">
          {entry.data.moves.map((m, i) => (
            <Move key={i} m={m} onPick={onPick} />
          ))}
        </ul>
      )}
    </section>
  )
}
