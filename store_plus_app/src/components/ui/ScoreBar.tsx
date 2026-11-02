import type { CSSProperties } from 'react'

interface Props {
  label: string
  pct: number
  value: string | number
  hot?: boolean
  columns?: string
}

export default function ScoreBar({ label, pct, value, hot, columns }: Props) {
  const style: CSSProperties | undefined = columns ? { gridTemplateColumns: columns } : undefined
  return (
    <div className="scorebar" style={style}>
      <span>{label}</span>
      <div className="track">
        <span className={hot ? 'hot' : ''} style={{ width: `${pct}%` }} />
      </div>
      <b>{value}</b>
    </div>
  )
}

export interface ScoreRow {
  label: string
  pct: number
  value: string | number
  hot?: boolean
}

export function ScoreBars({ rows, columns }: { rows: ScoreRow[]; columns?: string }) {
  return (
    <>
      {rows.map((r) => (
        <ScoreBar key={r.label} {...r} columns={columns} />
      ))}
    </>
  )
}
