import type { ReactNode } from 'react'

type Variant = '' | 'high' | 'low' | 'red' | 'green'

export default function Pill({ children, variant = '' }: { children: ReactNode; variant?: Variant }) {
  return <span className={`pill ${variant}`.trim()}>{children}</span>
}
