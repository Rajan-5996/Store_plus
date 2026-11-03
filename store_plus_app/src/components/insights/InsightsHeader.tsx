import { RiChatSmile3Line, RiLoader4Line, RiRefreshLine, RiSparkling2Fill } from '@remixicon/react'
import { useAskPulse } from '@/hooks/useAskPulse'
import type { ActionsPayload } from '@/types/store'
import InsightsArt from './InsightsArt'

interface Props {
  title: string
  /** What the insights were written from, e.g. "Bengaluru · Last 30 days". */
  context: string
  data: ActionsPayload | null
  loading: boolean
  onRegenerate: () => void
}

/** Dark header of the Pulse AI insights section: what it is, what it was written from, and its actions. */
export default function InsightsHeader({ title, context, data, loading, onRegenerate }: Props) {
  const askPulse = useAskPulse()
  const actions = data?.actions ?? []
  const high = actions.filter((a) => a.priority === 'high').length
  const time = data && new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="ai-head">
      <InsightsArt />
      <span className="ai-mark">
        <RiSparkling2Fill aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-72">
        <p className="ai-eyebrow">Pulse AI insights</p>
        <h2 className="ai-title">{title}</h2>
        <p className="ai-meta">
          {loading && !data ? (
            <span className="inline-flex items-center gap-1.5">
              <RiLoader4Line className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              Analysing {context}…
            </span>
          ) : (
            <>
              {data && (
                <span className={`ai-live ${data.source === 'mock' ? 'demo' : ''}`}>
                  <i aria-hidden />
                  {data.source === 'mock' ? 'Demo mode' : 'Live AI model'}
                </span>
              )}
              <span>{context}</span>
              {actions.length > 0 && (
                <>
                  <span className="dot" aria-hidden />
                  <span>
                    {actions.length} recommendation{actions.length === 1 ? '' : 's'}
                    {high > 0 && `, ${high} high priority`}
                  </span>
                </>
              )}
              {time && (
                <>
                  <span className="dot" aria-hidden />
                  <span>Updated {time}</span>
                </>
              )}
            </>
          )}
        </p>
      </div>
      <div className="ai-head-actions">
        <button type="button" className="btn on-dark" onClick={onRegenerate} disabled={loading}>
          <RiRefreshLine className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden />
          {loading ? 'Writing…' : 'Regenerate'}
        </button>
        <button type="button" className="btn solid" onClick={() => askPulse()}>
          <RiChatSmile3Line aria-hidden />
          Ask Pulse
        </button>
      </div>
    </div>
  )
}
