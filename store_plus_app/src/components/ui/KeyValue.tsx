import type { CSSProperties, ReactNode } from 'react'

export type KvRow = [label: ReactNode, value: ReactNode, tone?: 'loss' | 'gain']

export default function KeyValue({ rows, style }: { rows: KvRow[]; style?: CSSProperties }) {
  return (
    <dl className="kv" style={style}>
      {rows.map(([label, value, tone], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd className={tone}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
