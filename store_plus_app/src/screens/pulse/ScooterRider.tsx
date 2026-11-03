interface Props {
  x: number
  y: number
  /** Scale of the 120 × 90 drawing. */
  s?: number
  /** Wheel rim and headlight colour: cream on dark backgrounds, ink on light ones. */
  rim?: string
}

const ORANGE = '#FF5200'
const ORANGE_DARK = '#D94600'
const INK = '#2A211D'

/** A delivery partner on a scooter with an insulated delivery box (SVG group, facing right, 120 × 90 units). */
export default function ScooterRider({ x, y, s = 1, rim = '#FFF4EC' }: Props) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* speed lines */}
      <g stroke={ORANGE} strokeLinecap="round" strokeWidth="2.5" opacity=".55">
        <path d="M-26 40h18" />
        <path d="M-34 52h22" />
        <path d="M-22 64h12" />
      </g>
      {/* delivery box with the brand mark */}
      <rect x="6" y="20" width="36" height="32" rx="5" fill={ORANGE} />
      <rect x="6" y="20" width="36" height="7" rx="3" fill={ORANGE_DARK} />
      <image href="/favicon.png" x="16" y="30" width="16" height="16" />
      {/* scooter body, deck, stem, fender, handlebar, headlight */}
      <rect x="12" y="52" width="52" height="17" rx="8.5" fill={ORANGE} />
      <rect x="56" y="62" width="32" height="7" rx="3.5" fill={ORANGE_DARK} />
      <path d="M86 67 96 34" stroke={ORANGE} strokeWidth="7" strokeLinecap="round" />
      <path d="M84 73a13 13 0 0 1 25-2" stroke={ORANGE} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M90 33h12" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="99" cy="41" r="3" fill={rim} />
      {/* wheels */}
      <circle cx="28" cy="76" r="12" fill={INK} stroke={rim} strokeWidth="2.5" />
      <circle cx="28" cy="76" r="4" fill={rim} />
      <circle cx="97" cy="76" r="12" fill={INK} stroke={rim} strokeWidth="2.5" />
      <circle cx="97" cy="76" r="4" fill={rim} />
      {/* rider: leg, torso in delivery orange, arm to the handlebar, helmet with visor */}
      <path d="M46 50 66 52 71 63" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M47 48 59 25" stroke="#FF6A1F" strokeWidth="13" strokeLinecap="round" />
      <path d="M59 28Q76 29 92 34" stroke="#FF6A1F" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="62" cy="14" r="10" fill={ORANGE} />
      <path d="M58 6a10 10 0 0 1 14 6" stroke="#FF8A3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="64" y="11" width="10" height="6" rx="2.5" fill={INK} />
    </g>
  )
}
