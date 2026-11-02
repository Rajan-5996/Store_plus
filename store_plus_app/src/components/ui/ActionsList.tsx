import { RiAlarmWarningLine, RiFlashlightLine, RiLightbulbFlashLine, RiLoader4Line, RiRefreshLine, RiTimeLine } from '@remixicon/react'
import { useState } from 'react'
import type { ActionsEntry } from '@/features/agent/actionsSlice'
import type { AgentAction } from '@/types/store'
import Emphasis from './Emphasis'
import StoreLink from './StoreLink'

const ACCENT = {
  high: { cls: 'kpi-c7', label: 'High priority', Icon: RiAlarmWarningLine },
  medium: { cls: 'kpi-c1', label: 'Medium priority', Icon: RiLightbulbFlashLine },
  low: { cls: 'kpi-c5', label: 'Low priority', Icon: RiTimeLine },
} as const

function Action({ a }: { a: AgentAction }) {
  const { cls, label, Icon } = ACCENT[a.priority]
  return (
    <li className={`box kpi kpi-c ${cls} rec-kcard`}>
      <div className="kpi-head">
        <div className="label">{label}</div>
        <span className="kpi-ico">
          <Icon />
        </span>
      </div>
      <div className="val">{a.title}</div>
      <div className="delta">
        <Emphasis text={a.why} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {a.impact && (
          <span className="rec-impact">
            <RiFlashlightLine className="size-3.5" aria-hidden />
            {a.impact}
          </span>
        )}
        {a.stores.map((c) => (
          <StoreLink key={c} code={c} chip />
        ))}
      </div>
    </li>
  )
}

/** Round button that asks the agent for fresh recommendations; it spins while one is being written. */
export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rec-icon-btn ml-auto"
      onClick={onClick}
      disabled={loading}
      aria-label="Regenerate recommendations"
      title="Regenerate"
    >
      <RiRefreshLine className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
    </button>
  )
}

export const isLoading = (e?: ActionsEntry) => !e || e.status === 'loading' || e.status === 'idle'

/** The agent's actions with their loading, error and "written at" states. */
export default function ActionsList({ entry, retry, limit, columns }: { entry?: ActionsEntry; retry: () => void; limit?: number; columns?: boolean }) {
  const loading = isLoading(entry)
  const [all, setAll] = useState(false)
  const actions = entry?.data?.actions ?? []
  const shown = limit && !all ? actions.slice(0, limit) : actions
  return (
    <>
      {entry?.data && (
        <>
          <ul className={`m-0 list-none gap-3 !p-0 ${columns ? 'grid grid-cols-1 min-[1100px]:grid-cols-2' : 'flex flex-col'}`} style={{ opacity: loading ? 0.6 : 1 }}>
            {shown.map((a) => (
              <Action key={a.title} a={a} />
            ))}
          </ul>
          {limit && actions.length > limit && (
            <button type="button" className="mt-2 text-[13px] font-bold text-cool-text hover:underline" onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show ${actions.length - limit} more`}
            </button>
          )}
          <p className="mt-2 text-[12px] text-muted">
            {entry.data.source === 'mock'
              ? 'Demo mode: set a Domo token for real recommendations.'
              : `Written by Pulse at ${new Date(entry.data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} from the data on this page.`}
          </p>
        </>
      )}
      {!entry?.data && loading && (
        <p className="flex items-center gap-2 text-[13px] text-muted" role="status">
          <RiLoader4Line className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Pulse is reading the data and writing recommendations…
        </p>
      )}
      {entry?.status === 'error' && (
        <div role="alert" className="text-[13px]">
          <p className="text-brand">{entry.error}</p>
          <button type="button" className="mt-1 font-bold text-brand underline" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </>
  )
}
