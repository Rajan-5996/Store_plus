import { useState } from 'react'
import {
  RiAlarmWarningFill,
  RiArrowRightLine,
  RiCheckLine,
  RiFileCopyLine,
  RiFlashlightFill,
  RiLightbulbFlashFill,
  RiRulerLine,
  RiTimeFill,
} from '@remixicon/react'
import { useAppSelector } from '@/app/hooks'
import { useAskPulse } from '@/hooks/useAskPulse'
import type { AgentAction } from '@/types/store'
import Emphasis from '../ui/Emphasis'
import StoreLink from '../ui/StoreLink'

const PRIORITY = {
  high: { label: 'High priority', Icon: RiAlarmWarningFill },
  medium: { label: 'Medium', Icon: RiLightbulbFlashFill },
  low: { label: 'Low', Icon: RiTimeFill },
} as const

const unsized = (impact: string) => !impact || /to be sized/i.test(impact)

/** One Pulse AI recommendation: priority, action, the evidence behind it, expected impact and the stores it targets. */
export default function InsightCard({ a, rank }: { a: AgentAction; rank?: number }) {
  const askPulse = useAskPulse()
  const chatBusy = useAppSelector((s) => s.chat.status === 'loading')
  const [copied, setCopied] = useState(false)
  const { label, Icon } = PRIORITY[a.priority]
  const sized = !unsized(a.impact)

  const ask = () =>
    askPulse(`Tell me more about this recommendation: "${a.title}". ${a.why} What exactly should we do first, and how sure are you about the impact?`)

  const copy = () => {
    const stores = a.stores.length ? `\nStores: ${a.stores.join(', ')}` : ''
    const text = `${a.title}\n${a.why}\nExpected impact: ${a.impact || 'to be sized'}${stores}`
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <li className={`insight p-${a.priority}`}>
      <div className="insight-top">
        {rank != null && <span className="insight-rank">{String(rank).padStart(2, '0')}</span>}
        <span className="insight-prio">
          <Icon aria-hidden />
          {label}
        </span>
      </div>
      <h4>{a.title}</h4>
      <p className="why">
        <Emphasis text={a.why} />
      </p>
      <div className={`insight-impact ${sized ? '' : 'unsized'}`}>
        {sized ? <RiFlashlightFill aria-hidden /> : <RiRulerLine aria-hidden />}
        <span>
          <small>Expected impact</small>
          <b>{sized ? a.impact : 'To be sized with the team'}</b>
        </span>
      </div>
      {a.stores.length > 0 && (
        <div className="insight-stores" aria-label="Stores">
          {a.stores.map((c) => (
            <StoreLink key={c} code={c} chip />
          ))}
        </div>
      )}
      <div className="insight-foot">
        <button type="button" className="insight-ask" onClick={ask} disabled={chatBusy}>
          Ask Pulse why <RiArrowRightLine aria-hidden />
        </button>
        <span className="sp" />
        <button type="button" className="rec-icon-btn" onClick={copy} aria-label={copied ? 'Copied' : 'Copy recommendation'} title={copied ? 'Copied' : 'Copy'}>
          {copied ? <RiCheckLine className="size-4 text-gain" aria-hidden /> : <RiFileCopyLine className="size-4" aria-hidden />}
        </button>
      </div>
    </li>
  )
}
