import type { ReactNode } from 'react'

export type PillVariant = '' | 'high' | 'low' | 'red' | 'green' | 'warn' | 'blue'

export default function Pill({ children, variant = '' }: { children: ReactNode; variant?: PillVariant }) {
  return <span className={`pill ${variant}`.trim()}>{children}</span>
}
