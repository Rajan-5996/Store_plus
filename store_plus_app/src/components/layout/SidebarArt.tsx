/** Swiggy orange: the shapes glow softly against the dark charcoal sidebar. */
const ART = '#FF5200'

/** Abstract decorative artwork anchored to the bottom of the sidebar, fading out toward the top. */
export default function SidebarArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[92%]"
      style={{
        maskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,.7) 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,.7) 50%, transparent 100%)',
      }}
    >
      <svg className="size-full" viewBox="0 0 240 760" preserveAspectRatio="xMidYMax slice" fill="none">
        <g transform="translate(0 340)">
        {/* soft layered waves */}
        <path d="M0 300 C60 250 120 350 240 280 L240 420 L0 420 Z" fill={ART} fillOpacity=".10" />
        <path d="M0 340 C70 300 130 390 240 330 L240 420 L0 420 Z" fill={ART} fillOpacity=".12" />
        <path d="M0 385 C80 355 150 410 240 372 L240 420 L0 420 Z" fill={ART} fillOpacity=".16" />
        {/* concentric rings */}
        <g stroke={ART} strokeOpacity=".28" strokeWidth="1.5">
          <circle cx="40" cy="330" r="30" />
          <circle cx="40" cy="330" r="52" strokeOpacity=".2" />
          <circle cx="40" cy="330" r="76" strokeOpacity=".12" />
        </g>
        {/* solid shapes */}
        <circle cx="190" cy="250" r="22" fill={ART} fillOpacity=".14" />
        <circle cx="205" cy="372" r="34" fill={ART} fillOpacity=".12" />
        <rect x="96" y="285" width="34" height="34" rx="6" transform="rotate(20 113 302)" fill={ART} fillOpacity=".12" />
        <path d="M150 190 L176 235 L124 235 Z" fill={ART} fillOpacity=".10" />
        {/* dotted grid */}
        <g fill={ART} fillOpacity=".35">
          {Array.from({ length: 4 }).flatMap((_, r) =>
            Array.from({ length: 5 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={20 + c * 14} cy={228 + r * 14} r="1.6" />
            )),
          )}
        </g>
        {/* flowing lines */}
        <path d="M0 270 C50 240 90 300 150 262 S220 250 240 236" stroke={ART} strokeOpacity=".3" strokeWidth="1.5" />
        <path d="M0 296 C60 268 100 326 160 288 S224 276 240 262" stroke={ART} strokeOpacity=".2" strokeWidth="1.5" />
        </g>
        {/* upper artwork — extends the image higher up the sidebar */}
        <g>
          <path d="M0 330 C70 290 130 370 240 300 L240 340 C130 410 70 330 0 370 Z" fill={ART} fillOpacity=".10" />
          <path d="M0 200 C60 160 120 240 240 180" stroke={ART} strokeOpacity=".28" strokeWidth="1.5" />
          <path d="M0 228 C70 190 130 268 240 210" stroke={ART} strokeOpacity=".2" strokeWidth="1.5" />
          <g stroke={ART} strokeOpacity=".24" strokeWidth="1.5">
            <circle cx="190" cy="120" r="34" />
            <circle cx="190" cy="120" r="58" strokeOpacity=".16" />
            <circle cx="190" cy="120" r="84" strokeOpacity=".1" />
          </g>
          <circle cx="50" cy="150" r="26" fill={ART} fillOpacity=".13" />
          <circle cx="110" cy="60" r="12" fill={ART} fillOpacity=".16" />
          <rect x="30" y="250" width="40" height="40" rx="6" transform="rotate(-18 50 270)" fill={ART} fillOpacity=".11" />
          <path d="M150 270 L182 322 L118 322 Z" fill={ART} fillOpacity=".11" />
          <g fill={ART} fillOpacity=".3">
            {Array.from({ length: 5 }).flatMap((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`u${r}-${c}`} cx={150 + c * 14} cy={170 + r * 14} r="1.6" />
              )),
            )}
          </g>
        </g>
      </svg>
    </div>
  )
}
