import { useEffect, useRef } from 'react'
import { RiCheckLine, RiLoader4Line } from '@remixicon/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { chatScope } from '@/data/chatChips'

const label: Record<string, string> = {
  dashboard_summary: 'dashboard summary',
  store_profile: 'store profile',
  read_skill: 'skill',
  read_skill_reference: 'reference',
  run_sql: 'query',
  find_store: 'store lookup',
  list_tables: 'tables',
  describe_table: 'schema',
}

/** Summarises the tool calls behind an answer, e.g. "2 skills · 4 queries". */
function usage(tools: string[]) {
  const counts = new Map<string, number>()
  tools.forEach((t) => counts.set(label[t] ?? t, (counts.get(label[t] ?? t) ?? 0) + 1))
  return [...counts].map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`).join(' · ')
}

export default function ChatMessages() {
  const messages = useAppSelector((s) => s.chat.messages)
  const loading = useAppSelector((s) => s.chat.status === 'loading')
  const steps = useAppSelector((s) => s.chat.steps)
  const end = useRef<HTMLDivElement>(null)
  const screen = useLocation().pathname.replace('/', '') || 'overview'
  const scope = chatScope[screen] ?? 'questions about your stores'

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, loading, steps.length])

  return (
    <div className="msgs">
      {messages.length === 0 && (
        <div className="msg">
          Hi, I am Pulse. Ask me {scope}. I read the store data to answer, so complex questions can take a minute.
        </div>
      )}
      {messages.map((m) =>
        m.role === 'user' ? (
          <div key={m.id} className="msg me">
            {m.text}
          </div>
        ) : (
          <div key={m.id} className={`msg md ${m.role === 'error' ? 'err' : ''}`}>
            <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
            {m.tools && m.tools.length > 0 && (
              <div className="mt-2 text-[12.5px] text-muted">Used {usage(m.tools)}</div>
            )}
          </div>
        ),
      )}
      {loading && (
        <div className="msg text-muted" role="status" aria-live="polite">
          <div className="font-semibold">Pulse is working on it</div>
          <ul className="mt-1.5 list-none space-y-1 !p-0 text-[13px]">
            {steps.map((t, i) => {
              const active = i === steps.length - 1
              return (
                <li key={i} className={`flex items-center gap-2 ${active ? 'text-brand' : ''}`}>
                  {active ? (
                    <RiLoader4Line className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
                  ) : (
                    <RiCheckLine className="size-4 shrink-0" aria-hidden />
                  )}
                  <span>{t}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div ref={end} />
    </div>
  )
}
