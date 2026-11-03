import { RiInformationLine } from '@remixicon/react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/** Small ⓘ icon that explains how a metric is calculated, on hover or keyboard focus. */
export default function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="info-tip" aria-label={`How this is calculated: ${text}`}>
        <RiInformationLine aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-left text-[12px] leading-snug font-medium">{text}</TooltipContent>
    </Tooltip>
  )
}
