import { RiRefreshLine } from '@remixicon/react'
import { useState } from 'react'
import type { ActionsEntry } from '@/features/agent/actionsSlice'
import InsightCard from '../insights/InsightCard'

/** Round button that asks the agent for fresh recommendations; it spins while one is being written. */
export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" className="rec-icon-btn" onClick={onClick} disabled={loading} aria-label="Regenerate recommendations" title="Regenerate">
      <RiRefreshLine className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
    </button>
  )
}

export const isLoading = (e?: ActionsEntry) => !e || e.status === 'loading' || e.status === 'idle'

/** Compact list of the agent's actions (Network side panel), with its loading and error states. */
export default function ActionsList({ entry, retry, limit }: { entry?: ActionsEntry; retry: () => void; limit?: number }) {
  const loading = isLoading(entry)
  const [all, setAll] = useState(false)
  const actions = entry?.data?.actions ?? []
  const shown = limit && !all ? actions.slice(0, limit) : actions
  return (
    <>
      {entry?.data && (
        <>
          <ul className="ai-grid one" style={{ opacity: loading ? 0.6 : 1 }}>
            {shown.map((a, i) => (
              <InsightCard key={a.title} a={a} rank={i + 1} />
            ))}
          </ul>
          {limit && actions.length > limit && (
            <button type="button" className="mt-2 text-[13px] font-bold text-cool-text hover:underline" onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show ${actions.length - limit} more`}
            </button>
          )}
        </>
      )}
      {!entry?.data && loading && (
        <ul className="ai-grid one" role="status" aria-label="Pulse is writing recommendations">
          {[0, 1].map((i) => (
            <li key={i} className="insight flex flex-col gap-2.5">
              <div className="skel" style={{ width: '35%', height: 12 }} />
              <div className="skel" style={{ width: '85%', height: 14 }} />
              <div className="skel" style={{ width: '100%', height: 10 }} />
            </li>
          ))}
        </ul>
      )}
      {entry?.status === 'error' && (
        <div role="alert" className="rounded-lg bg-loss-bg px-3 py-2.5 text-[13px] text-loss">
          <p className="m-0 font-semibold">Pulse could not write recommendations. {entry.error}</p>
          <button type="button" className="mt-1 font-bold underline" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </>
  )
}
