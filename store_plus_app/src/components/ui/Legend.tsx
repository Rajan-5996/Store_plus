import type { ReactNode } from 'react'

/** Legend swatch: kind = '' (solid grey), 'dash', 'red', 'green'; or a custom background colour. */
export function LegendItem({ kind = '', color, children }: { kind?: string; color?: string; children: ReactNode }) {
  return (
    <span>
      <i className={kind} style={color ? { background: color } : undefined} />
      {children}
    </span>
  )
}

export function Legend({ children }: { children: ReactNode }) {
  return <div className="legend">{children}</div>
}

export function Axis({ labels }: { labels: string[] }) {
  return (
    <div className="axis">
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  )
}
