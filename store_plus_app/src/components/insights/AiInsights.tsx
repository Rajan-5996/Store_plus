import { useState } from 'react'
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckDoubleLine, RiShieldCheckLine } from '@remixicon/react'
import { useAppSelector } from '@/app/hooks'
import { isLoading } from '@/components/ui/ActionsList'
import { useActions } from '@/hooks/useActions'
import type { AgentAction } from '@/types/store'
import InsightCard from './InsightCard'
import InsightsHeader from './InsightsHeader'

type Tab = 'all' | AgentAction['priority']
const TABS: [Tab, string][] = [['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]
const FIRST = 3 // one row of cards; the rest open with "Show all"

interface Props {
  /** A dashboard screen ("inventory") or one store ("store:524"). */
  scope: string
  title: string
}

/** Pulse AI insights: its own page section with the agent's ranked recommendations for the numbers on this page. */
export default function AiInsights({ scope, title }: Props) {
  const { entry, reload, retry } = useActions(scope)
  const { city, range, options } = useAppSelector((s) => s.filters)
  const [tab, setTab] = useState<Tab>('all')
  const [all, setAll] = useState(false)

  const loading = isLoading(entry)
  const data = entry?.data ?? null
  const ranked = (data?.actions ?? []).map((a, i) => ({ a, rank: i + 1 }))
  const count = (t: Tab) => (t === 'all' ? ranked.length : ranked.filter((r) => r.a.priority === t).length)
  const active: Tab = count(tab) > 0 ? tab : 'all' // a regenerate can empty the chosen priority
  const filtered = active === 'all' ? ranked : ranked.filter((r) => r.a.priority === active)
  const shown = all ? filtered : filtered.slice(0, FIRST)

  const rangeLabel = options.ranges.find((r) => r.key === range)?.label ?? 'Last 30 days'
  const where = scope.startsWith('store:') ? `Store #${scope.slice(6)}` : (options.cities.find((c) => c.code === city)?.name ?? 'All cities')
  const context = `${where} · ${rangeLabel}`

  return (
    <section className="ai-sec" aria-label="Pulse AI insights" aria-busy={loading}>
      <InsightsHeader title={title} context={context} data={data} loading={loading} onRegenerate={reload} />
      <div className="ai-body">
        {!data && loading && (
          <ul className="ai-grid" role="status" aria-label="Pulse is writing recommendations">
            {[0, 1, 2].map((i) => (
              <li key={i} className="insight flex flex-col gap-2.5">
                <div className="skel" style={{ width: '38%', height: 14 }} />
                <div className="skel" style={{ width: '88%', height: 16 }} />
                <div className="skel" style={{ width: '100%', height: 11 }} />
                <div className="skel" style={{ width: '76%', height: 11 }} />
                <div className="skel mt-1" style={{ width: '100%', height: 40 }} />
              </li>
            ))}
          </ul>
        )}

        {entry?.status === 'error' && (
          <div role="alert" className="mb-3 rounded-lg bg-loss-bg px-3 py-2.5 text-[13px] text-loss">
            <p className="m-0 font-semibold">Pulse could not write recommendations. {entry.error}</p>
            <button type="button" className="mt-1 font-bold underline" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {data && ranked.length === 0 && (
          <div className="state">
            <span className="state-ico empty">
              <RiCheckDoubleLine aria-hidden />
            </span>
            <h3>Nothing needs action right now</h3>
            <p>Pulse found no issue worth acting on in this page's numbers. Change the filters or regenerate to check again.</p>
          </div>
        )}

        {data && ranked.length > 0 && (
          <>
            <div className="ai-toolbar">
              <div className="seg" role="group" aria-label="Filter by priority">
                {TABS.filter(([t]) => t === 'all' || count(t) > 0).map(([t, label]) => (
                  <button key={t} type="button" aria-pressed={active === t} onClick={() => setTab(t)}>
                    {label}
                    <span className="count">{count(t)}</span>
                  </button>
                ))}
              </div>
              <span className="hint">Ranked by expected impact</span>
            </div>
            <ul className="ai-grid" style={{ opacity: loading ? 0.6 : 1 }}>
              {shown.map(({ a, rank }) => (
                <InsightCard key={a.title} a={a} rank={rank} />
              ))}
            </ul>
            {filtered.length > FIRST && (
              <div className="ai-more">
                <button type="button" className="btn" onClick={() => setAll(!all)}>
                  {all ? <RiArrowUpSLine aria-hidden /> : <RiArrowDownSLine aria-hidden />}
                  {all ? 'Show fewer' : `Show all ${filtered.length} recommendations`}
                </button>
              </div>
            )}
          </>
        )}

        <div className="ai-foot">
          <RiShieldCheckLine aria-hidden />
          <span className="grow">
            Written by Pulse AI from the same numbers shown on this page. Figures and store codes come from the data; review each action before acting on it.
          </span>
        </div>
      </div>
    </section>
  )
}
