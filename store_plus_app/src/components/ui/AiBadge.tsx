import { RiSparkling2Fill } from '@remixicon/react'

/** "Pulse AI" label that marks content written by the agent rather than calculated. */
export default function AiBadge() {
  return (
    <span className="ai-badge">
      <RiSparkling2Fill aria-hidden />
      Pulse AI
    </span>
  )
}
