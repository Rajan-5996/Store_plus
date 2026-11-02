const O = '#FF5200'

/** Simple abstract background for the greeting hero: a few soft circles, a ring and one wave. */
export default function HeroArt() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -top-[3.25rem] left-0 h-[calc(100%+3.25rem)] w-full"
      viewBox="0 0 900 340"
      preserveAspectRatio="xMaxYMin slice"
      fill="none"
    >
      <circle cx="790" cy="80" r="90" fill={O} fillOpacity=".12" />
      <circle cx="790" cy="80" r="140" stroke={O} strokeOpacity=".18" strokeWidth="1.5" />
      <circle cx="640" cy="200" r="38" fill={O} fillOpacity=".1" />
      <circle cx="860" cy="230" r="22" fill={O} fillOpacity=".16" />
      <path d="M380 250 C470 200 560 290 660 240 S820 200 900 230" stroke={O} strokeOpacity=".28" strokeWidth="1.8" />
    </svg>
  )
}
