import { useEffect, useRef, useState } from 'react'
import { RiHistoryLine } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { openThread } from '@/features/chat/chatSlice'
import { fetchThreads } from '@/features/chat/historySlice'
import PulseHistoryItem from './PulseHistoryItem'

/** "History": the saved conversations, newest first. Pick one to read it again and carry on; styled for the dark header (`dark`) or the light toolbar. */
export default function PulseHistory({ dark }: { dark?: boolean }) {
  const dispatch = useAppDispatch()
  const { threads, status, error } = useAppSelector((s) => s.history)
  const { threadId, status: chat } = useAppSelector((s) => s.chat)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const busy = chat === 'loading' // switching mid-answer would put the answer in the wrong conversation

  useEffect(() => {
    // close on a click outside or Escape, listened for on the document: a row swapping to its delete prompt, or being
    // deleted, drops focus out of the menu without the user leaving it
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const toggle = () => {
    if (!open) void dispatch(fetchThreads())
    setOpen(!open)
  }

  const pick = (id: string) => {
    setOpen(false)
    if (id !== threadId) void dispatch(openThread(id))
  }

  return (
    <div
      ref={box}
      className="pulse-hist"
      onBlur={(e) => {
        const to = e.relatedTarget as Node | null
        if (to && !e.currentTarget.contains(to)) setOpen(false) // tabbed out of the menu
      }}
    >
      <button
        type="button"
        className={dark ? 'btn on-dark' : 'btn'}
        onClick={toggle}
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Conversation history"
      >
        <RiHistoryLine aria-hidden />
        <span className="wide">History</span>
      </button>
      {open && (
        <div className="pulse-hist-menu" role="dialog" aria-label="Conversation history">
          <p className="pulse-hist-head">Recent conversations</p>
          {error && <p className="pulse-hist-note err">{error}</p>}
          {status === 'loading' && threads.length === 0 && <p className="pulse-hist-note">Loading…</p>}
          {status === 'ready' && threads.length === 0 && <p className="pulse-hist-note">No saved conversations yet. Ask Pulse a question to start one.</p>}
          {threads.length > 0 && (
            <ul>
              {threads.map((t) => (
                <PulseHistoryItem key={t.id} t={t} current={t.id === threadId} onOpen={() => pick(t.id)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
