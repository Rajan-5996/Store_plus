import type { ReactNode } from 'react'

export type Head = string | { t: ReactNode; r?: boolean }
/** A cell is plain content, or { v, r } to right-align / add a class. */
export interface CellObj {
  v: ReactNode
  r?: boolean
  cls?: string
}
export type Cell = ReactNode | CellObj

const isCellObj = (c: Cell): c is CellObj =>
  typeof c === 'object' && c !== null && !Array.isArray(c) && 'v' in c

interface Props {
  head: Head[]
  rows: Cell[][]
  onRowClick?: (index: number) => void
}

export default function SimpleTable({ head, rows, onRowClick }: Props) {
  return (
    <table>
      <thead>
        <tr>
          {head.map((h, i) =>
            typeof h === 'string' ? (
              <th key={i}>{h}</th>
            ) : (
              <th key={i} className={h.r ? 'r' : ''}>
                {h.t}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={onRowClick ? 'click' : ''} onClick={onRowClick && (() => onRowClick(ri))}>
            {row.map((c, ci) => {
              const o: CellObj = isCellObj(c) ? c : { v: c }
              return (
                <td key={ci} className={`${o.r ? 'r' : ''} ${o.cls ?? ''}`.trim()}>
                  {o.v}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
