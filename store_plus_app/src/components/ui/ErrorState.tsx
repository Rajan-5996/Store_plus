import { RiErrorWarningLine, RiRefreshLine } from '@remixicon/react'

interface Props {
  title: string
  message?: string | null
  onRetry?: () => void
}

/** Card shown when data could not be loaded, with a retry button. */
export default function ErrorState({ title, message, onRetry }: Props) {
  return (
    <div className="box state" role="alert">
      <span className="state-ico err">
        <RiErrorWarningLine aria-hidden />
      </span>
      <h3>{title}</h3>
      <p>{message ? `${message}. ` : ''}Check that the StorePulse API is reachable, then try again.</p>
      {onRetry && (
        <button type="button" className="btn mt-3" onClick={onRetry}>
          <RiRefreshLine aria-hidden /> Try again
        </button>
      )}
    </div>
  )
}
