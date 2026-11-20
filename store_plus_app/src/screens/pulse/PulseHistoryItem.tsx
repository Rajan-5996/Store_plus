import { useState } from 'react'
import { RiDeleteBinLine } from '@remixicon/react'
import { useAppDispatch } from '@/app/hooks'
import { deleteThread } from '@/features/chat/historySlice'
import { ago } from '@/lib/format'
import type { ChatThreadApi } from '@/types/api'

interface Props {
  t: ChatThreadApi
  /** The conversation open on the page right now. */
  current: boolean
  onOpen: () => void
}

/** One saved conversation in the History menu: its first question, size and age. Delete asks once more. */
export default function PulseHistoryItem({ t, current, onOpen }: Props) {
  const dispatch = useAppDispatch()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <li className="pulse-hist-item confirm">
        <span>Delete this conversation?</span>
        <button type="button" className="pulse-hist-act danger" onClick={() => void dispatch(deleteThread(t.id))}>
          Delete
        </button>
        <button type="button" className="pulse-hist-act" onClick={() => setConfirming(false)} autoFocus>
          Keep
        </button>
      </li>
    )
  }

  return (
    <li className={`pulse-hist-item ${current ? 'on' : ''}`}>
      <button type="button" className="pulse-hist-open" onClick={onOpen} aria-current={current || undefined}>
        <span className="pulse-hist-title">{t.title}</span>
        <span className="pulse-hist-meta">
          {t.questions} question{t.questions === 1 ? '' : 's'} · {ago(t.updatedAt)}
          {current && ' · open now'}
        </span>
      </button>
      <button type="button" className="pulse-hist-del" onClick={() => setConfirming(true)} aria-label={`Delete conversation: ${t.title}`}>
        <RiDeleteBinLine aria-hidden />
      </button>
    </li>
  )
}
