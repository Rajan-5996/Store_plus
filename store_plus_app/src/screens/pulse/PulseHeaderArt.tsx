import ScooterRider from './ScooterRider'

const ORANGE = '#FF5200'

/** Header scene for the Pulse AI section: a delivery partner riding past dark-store buildings towards a drop pin. */
export default function PulseHeaderArt() {
  return (
    <svg className="pulse-head-art" viewBox="0 0 360 96" fill="none" aria-hidden>
      {/* skyline of dark stores, softly lit */}
      <g fill={ORANGE} opacity=".16">
        <rect x="8" y="34" width="34" height="62" rx="3" />
        <rect x="46" y="18" width="26" height="78" rx="3" />
        <rect x="76" y="44" width="40" height="52" rx="3" />
        <rect x="250" y="30" width="30" height="66" rx="3" />
        <rect x="284" y="48" width="26" height="48" rx="3" />
      </g>
      <g fill="#FFF4EC" opacity=".22">
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`a${r}${c}`} x={15 + c * 12} y={44 + r * 14} width="6" height="6" rx="1" />))}
        {[0, 1, 2, 3].map((r) => <rect key={`b${r}`} x="56" y={28 + r * 14} width="6" height="6" rx="1" />)}
        {[0, 1].map((r) => [0, 1].map((c) => <rect key={`c${r}${c}`} x={258 + c * 12} y={42 + r * 14} width="6" height="6" rx="1" />))}
      </g>
      {/* road and the dashed route to the customer */}
      <path d="M0 94H360" stroke="#FFF4EC" strokeOpacity=".14" strokeWidth="2" />
      <path d="M210 70C250 52 290 40 330 26" stroke={ORANGE} strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" opacity=".8" />
      {/* drop pin */}
      <path d="M334 6c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12Z" fill={ORANGE} />
      <circle cx="334" cy="18" r="4.5" fill="#FFF4EC" />
      <ScooterRider x={128} y={4} s={1} />
    </svg>
  )
}
