import { RiArrowDownLine, RiArrowUpLine, type RemixiconComponentType } from '@remixicon/react'

interface Props {
  /** Signed change; only its sign is used for the arrow and colour. */
  change: number
  /** What to print, e.g. "6.5%" or "₹10K/day". */
  text: string
  /** False when a rise is bad news (costs, queue time). */
  higherIsBetter?: boolean
}

/** A change against the previous period as a chip: green when it moved the good way, red when it moved the bad way. */
export default function Trend({ change, text, higherIsBetter = true }: Props) {
  const Icon: RemixiconComponentType = change >= 0 ? RiArrowUpLine : RiArrowDownLine
  const tone = change === 0 ? 'flat' : change > 0 === higherIsBetter ? 'good' : 'bad'
  return (
    <span className={`trend ${tone}`}>
      <Icon aria-hidden />
      <span className="sr-only">{change >= 0 ? 'Up' : 'Down'}</span>
      {text}
    </span>
  )
}
