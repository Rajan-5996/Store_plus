import type { ReactNode } from 'react'
import type { Confidence } from '../../data/stores'

type Variant = '' | 'high' | 'low' | 'red' | 'green'

export default function Pill({ children, variant = '' }: { children: ReactNode; variant?: Variant }) {
  return <span className={`pill ${variant}`.trim()}>{children}</span>
}

export function ConfidencePill({ level }: { level: Confidence }) {
  return <Pill variant={level === 'High' ? 'high' : level === 'Low' ? 'low' : ''}>{level}</Pill>
}
