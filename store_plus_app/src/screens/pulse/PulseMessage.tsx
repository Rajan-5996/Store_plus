import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RiCheckLine, RiDatabase2Line, RiErrorWarningLine, RiFileCopyLine } from '@remixicon/react'
import type { ChatMessage } from '@/features/chat/chatSlice'
import { USER_NAME } from '@/data/user'

const TOOL: Record<string, string> = {
  dashboard_summary: 'dashboard summary',
  store_profile: 'store profile',
  read_skill: 'playbook',
  read_skill_reference: 'reference',
  run_sql: 'query',
  find_store: 'store lookup',
  list_tables: 'table list',
  describe_table: 'schema',
}

const plural = (word: string) => (/[^aeiou]y$/.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`)

/** Summarises the tool calls behind an answer, e.g. "2 playbooks · 4 queries". */
function usage(tools: string[]) {
  const counts = new Map<string, number>()
  tools.forEach((t) => counts.set(TOOL[t] ?? t, (counts.get(TOOL[t] ?? t) ?? 0) + 1))
  return [...counts].map(([k, n]) => `${n} ${n > 1 ? plural(k) : k}`).join(' · ')
}

/** One turn of the conversation: the user's question, Pulse's markdown answer with the data it used, or an error. */
export default function PulseMessage({ m }: { m: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  if (m.role === 'user') {
    return (
      <div className="pmsg me" id={`q-${m.id}`}>
        <span className="pmsg-av you" aria-hidden>
          {USER_NAME[0]?.toUpperCase()}
        </span>
        <div className="pmsg-body">
          <div className="pmsg-name">You</div>
          <div className="pmsg-bubble">{m.text}</div>
        </div>
      </div>
    )
  }

  const err = m.role === 'error'
  const copy = () =>
    void navigator.clipboard?.writeText(m.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })

  return (
    <div className={`pmsg ai ${err ? 'err' : ''}`}>
      <img src="/favicon.png" alt="" className="pmsg-av ai" />
      <div className="pmsg-body">
        <div className="pmsg-name">Pulse AI</div>
        <div className="pmsg-bubble pmsg-md">
          {err ? (
            <p className="flex items-start gap-2">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              {m.text}
            </p>
          ) : (
            <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>{m.text}</Markdown>
          )}
        </div>
        {!err && (
          <div className="pmsg-tools">
            {m.tools && m.tools.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <RiDatabase2Line aria-hidden /> Used {usage(m.tools)}
              </span>
            )}
            <button type="button" className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-semibold text-muted hover:text-ink" onClick={copy}>
              {copied ? <RiCheckLine className="text-gain" aria-hidden /> : <RiFileCopyLine aria-hidden />}
              {copied ? 'Copied' : 'Copy answer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
