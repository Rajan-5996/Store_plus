import { RiArrowLeftRightLine, RiCheckboxCircleLine, RiDownload2Line, RiListCheck2, RiStackLine, RiTimeLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchTransfers, setTransferStatus } from '@/features/transfers/transfersSlice'
import { fmt } from '@/lib/format'
import type { TransferEntry, TransferStatus } from '@/types/store'
import Box from '../components/ui/Box'
import ErrorState from '../components/ui/ErrorState'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenHeader from '../components/ui/ScreenHeader'
import SimpleTable from '../components/ui/SimpleTable'
import StoreLink from '../components/ui/StoreLink'

const TABS: ['all' | TransferStatus, string][] = [['all', 'All'], ['planned', 'Planned'], ['done', 'Done'], ['cancelled', 'Cancelled']]
const TYPE = { Demand: 'Orders', Stock: 'Stock', Staff: 'Staff hours' } as const

const product = (e: TransferEntry) => e.item ?? (e.kind === 'Demand' ? 'Customer orders' : 'Picker hours')
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function downloadCsv(rows: TransferEntry[]) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ['Logged', 'Type', 'Product', 'Quantity', 'Unit', 'From', 'To', 'Status', 'Why']
  const body = rows.map((e) =>
    [when(e.createdAt), TYPE[e.kind], product(e), e.quantity, e.unit, `${e.from.code} ${e.from.area}`, `${e.to.code} ${e.to.area}`, e.status, e.reason].map(cell).join(','),
  )
  const url = URL.createObjectURL(new Blob([[head.map(cell).join(','), ...body].join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'transfer-log.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/** Every transfer someone decided to plan from the Network page: what moves, how much, from which store to which. */
export default function Transfers() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((s) => s.transfers)
  const [tab, setTab] = useState<'all' | TransferStatus>('all')

  useEffect(() => {
    void dispatch(fetchTransfers())
  }, [dispatch])

  const count = (st: TransferStatus) => items.filter((e) => e.status === st).length
  const shown = tab === 'all' ? items : items.filter((e) => e.status === tab)
  const units = items.filter((e) => e.kind === 'Stock' && e.status !== 'cancelled').reduce((a, e) => a + e.quantity, 0)

  return (
    <section>
      <ScreenHeader
        title="Transfer log"
        sub="What is being moved, how much, and from which store to which. Log a move from a store's recommendations on Network optimisation."
        filters="none"
      />
      <KpiGrid
        icons={[RiListCheck2, RiTimeLine, RiCheckboxCircleLine, RiStackLine]}
        items={[
          { label: 'Logged transfers', value: fmt(items.length), delta: 'All time' },
          { label: 'Planned', value: fmt(count('planned')), delta: 'Waiting to be carried out' },
          { label: 'Done', value: fmt(count('done')), tone: count('done') > 0 ? 'gain' : undefined, delta: 'Completed moves' },
          { label: 'Units of stock moving', value: fmt(units), delta: 'Planned or done' },
        ]}
      />
      <Box
        className="mt scroll"
        title="Transfers"
        sub="Change a status as the move happens. The CSV export follows the current tab."
        actions={
          <button type="button" className="btn" onClick={() => downloadCsv(shown)} disabled={shown.length === 0}>
            <RiDownload2Line aria-hidden /> Export CSV
          </button>
        }
      >
        <div className="seg mb-3" role="group" aria-label="Filter by status">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>
              {label}
              <span className="count">{key === 'all' ? items.length : count(key)}</span>
            </button>
          ))}
        </div>
        {status === 'error' && <ErrorState title="Could not load the transfer log" message={error} onRetry={() => void dispatch(fetchTransfers())} />}
        {status !== 'error' && shown.length === 0 && (
          <div className="state">
            <span className="state-ico empty">
              <RiArrowLeftRightLine aria-hidden />
            </span>
            <h3>{status === 'loading' ? 'Loading the log…' : 'No transfers here yet'}</h3>
            {status !== 'loading' && <p>Open a store on Network optimisation and press “Log this transfer” on a suggested move.</p>}
          </div>
        )}
        {shown.length > 0 && (
          <SimpleTable
            head={['Logged', 'Type', 'Product', { t: 'Quantity', r: true }, 'From', 'To', 'Status']}
            rows={shown.map((e) => [
              when(e.createdAt),
              TYPE[e.kind],
              <b key="p">{product(e)}</b>,
              { v: `${fmt(e.quantity)} ${e.unit}`, r: true },
              <>
                <StoreLink code={e.from.code} /> {e.from.area}
              </>,
              <>
                <StoreLink code={e.to.code} /> {e.to.area}
              </>,
              <select
                key="s"
                aria-label={`Status of transfer ${e.id}`}
                className={`rounded-md border px-2 py-1 text-[13px] font-semibold ${e.status === 'done' ? 'border-transparent bg-gain-bg text-gain' : e.status === 'cancelled' ? 'border-transparent bg-sunk text-muted' : 'border-transparent bg-warn-bg text-warn'}`}
                value={e.status}
                onChange={(ev) => void dispatch(setTransferStatus({ id: e.id, status: ev.target.value as TransferStatus }))}
              >
                <option value="planned">Planned</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>,
            ])}
          />
        )}
      </Box>
    </section>
  )
}
