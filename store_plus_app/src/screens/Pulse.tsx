import { useAppSelector } from '@/app/hooks'
import PulseChatHeader from './pulse/PulseChatHeader'
import PulseComposer from './pulse/PulseComposer'
import PulseThread from './pulse/PulseThread'
import PulseToolbar from './pulse/PulseToolbar'

/** Pulse AI: the whole page is the agent's conversation. The dark header welcomes; once a question is asked, a slim toolbar takes its place. */
export default function Pulse() {
  const started = useAppSelector((s) => s.chat.messages.length > 0 || s.chat.status === 'loading')
  return (
    <section className="pulse-chat" aria-label="Pulse AI">
      {started ? <PulseToolbar /> : <PulseChatHeader />}
      <PulseThread />
      <PulseComposer />
    </section>
  )
}
