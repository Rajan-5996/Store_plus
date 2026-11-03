import PulseControls from './PulseControls'
import PulseStatus from './PulseStatus'

/** Slim light bar that replaces the dark header once the conversation starts, keeping the focus picker and "New conversation". */
export default function PulseToolbar() {
  return (
    <div className="pulse-bar">
      <img src="/favicon.png" alt="" />
      <div className="pulse-bar-title">
        <h1>Pulse AI</h1>
        <PulseStatus />
      </div>
      <PulseControls />
    </div>
  )
}
