import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RiArrowUpLine } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { sendMessage } from '@/features/chat/chatSlice'

/** Question box: Enter sends, Shift+Enter adds a line; it grows with the text up to a few lines. */
export default function PulseComposer() {
  const dispatch = useAppDispatch()
  const { status, focus } = useAppSelector((s) => s.chat)
  const loading = status === 'loading'
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  useEffect(() => {
    // ready to type on desktop; on touch screens this would pop the keyboard up on every visit
    if (window.matchMedia('(pointer: fine)').matches) box.current?.focus({ preventScroll: true })
  }, [])

  const send = () => {
    const question = text.trim()
    if (!question || loading) return
    void dispatch(sendMessage({ text: question, screen: focus === 'all' ? '' : focus }))
    setText('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send()
  }

  return (
    <form className="pulse-composer" onSubmit={submit}>
      <div className="pulse-input">
        <textarea
          ref={box}
          rows={1}
          value={text}
          placeholder="Ask about a store, a city, a product or a metric…"
          aria-label="Your question for Pulse AI"
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button type="submit" className="pulse-send" disabled={loading || !text.trim()} aria-label="Send question">
          <RiArrowUpLine aria-hidden />
        </button>
      </div>
      <div className="pulse-hint">
        <span></span>
        <span className="keys">
          <span className="kbd">Enter</span> to send · <span className="kbd">Shift</span> + <span className="kbd">Enter</span> for a new line
        </span>
      </div>
    </form>
  )
}
