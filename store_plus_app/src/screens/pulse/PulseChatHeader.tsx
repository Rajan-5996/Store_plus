import PulseControls from './PulseControls'
import PulseHeaderArt from './PulseHeaderArt'
import PulseStatus from './PulseStatus'

/** Dark welcome header, shown only before the first question: who is answering, its focus area and a fresh start. */
export default function PulseChatHeader() {
  return (
    <div className="ai-head pulse-head">
      <img src="/favicon.png" alt="" className="pulse-logo" />
      <div className="min-w-0 flex-1 basis-60">
        <p className="ai-eyebrow">Pulse AI</p>
        <h1 className="ai-title">Your dark-store analyst</h1>
        <p className="ai-meta">
          <PulseStatus />
        </p>
      </div>
      <PulseHeaderArt />
      <PulseControls dark />
    </div>
  )
}
