import type { CSSProperties, ReactNode } from 'react'

export default function Note({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p className="note" style={style}>
      {children}
    </p>
  )
}
