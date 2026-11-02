import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  title?: ReactNode
}

export default function Box({ children, className = '', style, title }: Props) {
  return (
    <div className={`box ${className}`.trim()} style={style}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
