import { RiAddLine, RiFocus3Line } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import FilterSelect from '@/components/ui/FilterSelect'
import { PULSE_FOCUS } from '@/data/pulse'
import { solutionNav } from '@/data/screens'
import { clearChat, setChatFocus } from '@/features/chat/chatSlice'

const ALL = 'All dashboard areas'
const label = (key: string) => (key === 'all' ? ALL : (solutionNav.find((n) => n.path === key)?.label ?? ALL))

/** Focus area picker and "New conversation": styled for the dark header (`dark`) or the light toolbar. */
export default function PulseControls({ dark }: { dark?: boolean }) {
  const dispatch = useAppDispatch()
  const { focus, status, messages } = useAppSelector((s) => s.chat)
  const busy = status === 'loading'

  return (
    <div className="pulse-actions">
      <FilterSelect
        label="Focus"
        icon={RiFocus3Line}
        options={PULSE_FOCUS.map(label)}
        value={label(focus)}
        onChange={(name) => dispatch(setChatFocus(PULSE_FOCUS.find((k) => label(k) === name) ?? 'all'))}
      />
      <button
        type="button"
        className={dark ? 'btn on-dark' : 'btn'}
        onClick={() => dispatch(clearChat())}
        disabled={busy || messages.length === 0}
        aria-label="New conversation"
      >
        <RiAddLine aria-hidden /> New<span className="wide -ml-1">conversation</span>
      </button>
    </div>
  )
}
