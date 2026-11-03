import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { metricHints } from '@/data/metricHints'
import InfoTip from './InfoTip'

export interface KpiProps {
  /** Icon shown in a tinted chip at the top-right of the card. */
  icon?: ComponentType<{ className?: string }>
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
  tone?: 'loss' | 'gain'
  valueStyle?: CSSProperties
  /** How the number is calculated; defaults to the definition in data/metricHints for this label. */
  hint?: string
  /** Render without the surrounding box (nested KPI). */
  bare?: boolean
}

export default function Kpi({ label, value, delta, tone, valueStyle, bare, hint, icon: Icon }: KpiProps) {
  const tip = hint ?? (typeof label === 'string' ? metricHints[label] : undefined)
  return (
    <div className={bare ? 'kpi' : 'box kpi'}>
      <div className="kpi-head">
        <div className="label">
          {label}
          {tip && <InfoTip text={tip} />}
        </div>
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
