import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PULSE_SUGGESTIONS } from '@/data/pulse'
import { solutionNav } from '@/data/screens'
import { USER_NAME } from '@/data/user'
import { sendMessage } from '@/features/chat/chatSlice'
import PulseWelcomeArt from './PulseWelcomeArt'

/** Empty conversation: the store-to-door scene, a greeting, and six questions to start with (the focused area's first). */
export default function PulseWelcome() {
  const dispatch = useAppDispatch()
  const { focus, status } = useAppSelector((s) => s.chat)
  const screens = focus === 'all' ? Object.keys(PULSE_SUGGESTIONS) : [focus, ...Object.keys(PULSE_SUGGESTIONS).filter((k) => k !== focus)]
  // the focused area's questions first, then one from each other area
  const picks = screens
    .flatMap((k, i) => (i === 0 && focus !== 'all' ? PULSE_SUGGESTIONS[k] : PULSE_SUGGESTIONS[k].slice(0, 1)).map((q) => ({ k, q })))
    .slice(0, 6)

  return (
    <div className="pulse-welcome">
      <PulseWelcomeArt />
      <h2>Hi {USER_NAME}, what would you like to know?</h2>
      <p>Ask about any store, city, product or metric. Pulse reads the same store data as the dashboards and answers with the figures behind it.</p>
      <div className="pulse-sugg">
        {picks.map(({ k, q }) => {
          const nav = solutionNav.find((n) => n.path === k)
          const Icon = nav?.icon
          return (
            <button key={q} type="button" className="sugg" disabled={status === 'loading'} onClick={() => void dispatch(sendMessage({ text: q, screen: k }))}>
              <small>
                {Icon && <Icon aria-hidden />}
                {nav?.label}
              </small>
              <span>{q}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
