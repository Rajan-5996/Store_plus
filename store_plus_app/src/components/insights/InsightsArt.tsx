const ORANGE = '#FF5200'

/** Rings and dots in the insights header's right corner: the same motif as the sidebar artwork. */
export default function InsightsArt() {
  return (
    <svg className="ai-art" viewBox="0 0 340 120" preserveAspectRatio="xMaxYMid slice" fill="none" aria-hidden>
      <g stroke={ORANGE} strokeWidth="1.2">
        <circle cx="300" cy="22" r="34" strokeOpacity=".32" />
        <circle cx="300" cy="22" r="58" strokeOpacity=".2" />
        <circle cx="300" cy="22" r="84" strokeOpacity=".12" />
      </g>
      <circle cx="214" cy="96" r="14" fill={ORANGE} fillOpacity=".14" />
      <g fill={ORANGE} fillOpacity=".35">
        {Array.from({ length: 3 }).flatMap((_, r) =>
          Array.from({ length: 5 }).map((_, c) => <circle key={`${r}-${c}`} cx={150 + c * 12} cy={30 + r * 12} r="1.4" />),
        )}
      </g>
    </svg>
  )
}
