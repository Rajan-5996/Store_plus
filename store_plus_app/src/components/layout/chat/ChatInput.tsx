import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { sendMessage } from '@/features/chat/chatSlice'
import { chatChips, defaultChips } from '@/data/chatChips'

export default function ChatInput() {
  const dispatch = useAppDispatch()
  const loading = useAppSelector((s) => s.chat.status === 'loading')
  const [text, setText] = useState('')
  const screen = useLocation().pathname.replace('/', '') || 'overview'
  const chips = chatChips[screen] ?? defaultChips

  const send = (q: string) => {
    const question = q.trim()
    if (!question || loading) return
    void dispatch(sendMessage({ text: question, screen }))
    setText('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  return (
    <>
      <div className="chips">
        {chips.map((c) => (
          <button key={c} className="chip" type="button" disabled={loading} onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          className="ctl"
          style={{ flex: 1 }}
          placeholder="Ask about any store"
          aria-label="Question"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn solid" type="submit" disabled={loading || !text.trim()}>
          Ask
        </button>
      </form>
    </>
  )
}
