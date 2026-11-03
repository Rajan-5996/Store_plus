import { useAppSelector } from '@/app/hooks'

/** "Ready" / "Working on your question…" and how many questions this conversation has. */
export default function PulseStatus() {
  const { status, messages } = useAppSelector((s) => s.chat)
  const busy = status === 'loading'
  const asked = messages.filter((m) => m.role === 'user').length

  return (
    <>
      <span className={`pulse-status ${busy ? 'busy' : ''}`}>
        <i aria-hidden />
        {busy ? 'Working on your question…' : 'Ready'}
      </span>
      {asked > 0 && (
        <>
          <span className="dot" aria-hidden />
          <span>
            {asked} question{asked === 1 ? '' : 's'}
          </span>
        </>
      )}
    </>
  )
}
