import type { ComponentType, CSSProperties, ReactNode } from 'react'

export interface KpiProps {
  /** Colour variant 0-5 (soft tinted card). Omit for the plain card. */
  accent?: number
  /** Icon shown in a tinted chip at the top-right of the card. */
  icon?: ComponentType<{ className?: string }>
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
  tone?: 'loss' | 'gain'
  valueStyle?: CSSProperties
  /** Render without the surrounding box (nested KPI). */
  bare?: boolean
}

export default function Kpi({ label, value, delta, tone, valueStyle, bare, accent, icon: Icon }: KpiProps) {
  return (
    <div className={bare ? 'kpi' : `box kpi${accent != null ? ` kpi-c kpi-c${accent % 6}` : ''}`}>
      <div className="kpi-head">
        <div className="label">{label}</div>
        {Icon && (
          <span className="kpi-ico">
            <Icon />
          </span>
        )}
      </div>
      <div className={`val ${tone ?? ''}`.trim()} style={valueStyle}>
        {value}
      </div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  )
}
