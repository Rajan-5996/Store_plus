import type { CSSProperties, ReactNode } from 'react'
import InfoTip from './InfoTip'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  title?: ReactNode
  /** One line under the title saying how to read the card. */
  sub?: ReactNode
  /** How the numbers in the card are calculated (ⓘ tooltip beside the title). */
  hint?: string
  /** Buttons at the top-right of the card. */
  actions?: ReactNode
}

export default function Box({ children, className = '', style, title, sub, hint, actions }: Props) {
  return (
    <div className={`box ${className}`.trim()} style={style}>
      {(title || actions) && (
        <div className="box-head">
          <div className="min-w-0">
            {title && (
              <h3 className="box-title">
                {title}
                {hint && <InfoTip text={hint} />}
              </h3>
            )}
            {sub && <p className="box-sub">{sub}</p>}
          </div>
          {actions && <div className="box-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
