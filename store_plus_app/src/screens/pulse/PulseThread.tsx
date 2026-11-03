import { useEffect, useRef } from 'react'
import { RiCheckLine, RiLoader4Line } from '@remixicon/react'
import { useAppSelector } from '@/app/hooks'
import PulseMessage from './PulseMessage'
import PulseWelcome from './PulseWelcome'

/** The conversation, with Pulse's live progress while it works; scrolls to the newest turn. */
export default function PulseThread() {
  const { messages, steps, status } = useAppSelector((s) => s.chat)
  const loading = status === 'loading'
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // follow the newest turn; an empty conversation stays at the top so the welcome is visible
    if (messages.length > 0 || loading) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, loading, steps.length])

  return (
    <div className="pulse-thread" aria-live="polite">
      {messages.length === 0 && !loading && <PulseWelcome />}
      {messages.map((m) => (
        <PulseMessage key={m.id} m={m} />
      ))}
      {loading && (
        <div className="pmsg ai" role="status">
          <img src="/favicon.png" alt="" className="pmsg-av ai" />
          <div className="pmsg-body">
            <div className="pmsg-name">Pulse AI is working on it</div>
            <div className="pmsg-bubble">
              <ul className="pmsg-steps">
                {steps.length === 0 && (
                  <li className="on">
                    <RiLoader4Line className="animate-spin motion-reduce:animate-none" aria-hidden />
                    Reading your question…
                  </li>
                )}
                {steps.map((t, i) => {
                  const on = i === steps.length - 1
                  return (
                    <li key={i} className={on ? 'on' : ''}>
                      {on ? <RiLoader4Line className="animate-spin motion-reduce:animate-none" aria-hidden /> : <RiCheckLine className="text-gain" aria-hidden />}
                      {t}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 mb-0 text-[12px] text-muted">Complex questions can take up to a minute.</p>
            </div>
          </div>
        </div>
      )}
      <div ref={end} />
    </div>
  )
}
