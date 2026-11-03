import ScooterRider from './ScooterRider'

const ORANGE = '#FF5200'
const ORANGE_DARK = '#D94600'
const INK = '#2A211D'
const CREAM = '#FFF4EC'
const PEACH = '#FFE1CF'
const GREEN = '#1BA672'

/** Shelf products: [x, y, width, height, colour] on the store window. */
const PRODUCTS: [number, number, number, number, string][] = [
  [52, 112, 10, 14, GREEN], [64, 116, 12, 10, ORANGE], [78, 110, 8, 16, '#1F6FEB'], [88, 114, 12, 12, '#F5B400'], [102, 112, 10, 14, ORANGE_DARK], [114, 116, 14, 10, GREEN],
  [52, 136, 14, 12, '#F5B400'], [68, 132, 8, 16, ORANGE], [78, 136, 12, 12, GREEN], [92, 132, 10, 16, '#1F6FEB'], [104, 136, 12, 12, ORANGE], [118, 134, 10, 14, '#F5B400'],
]

/** Welcome scene: the dark store, a delivery partner on the way, and the customer's door with a grocery bag. */
export default function PulseWelcomeArt() {
  return (
    <svg className="pulse-welcome-art" viewBox="0 0 440 200" fill="none" role="img" aria-label="A dark store, a delivery partner on a scooter and a grocery bag at a customer's door">
      {/* ground */}
      <ellipse cx="220" cy="184" rx="210" ry="10" fill={ORANGE} opacity=".08" />
      <path d="M20 182H420" stroke={ORANGE} strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />

      {/* dark store: building, sign with the brand mark, striped awning, shelf window, door */}
      <rect x="36" y="58" width="112" height="124" rx="6" fill={PEACH} />
      <rect x="36" y="58" width="112" height="22" rx="6" fill={INK} />
      <image href="/favicon.png" x="44" y="61" width="16" height="16" />
      <rect x="66" y="66" width="70" height="4" rx="2" fill={CREAM} opacity=".8" />
      <rect x="66" y="72" width="44" height="3" rx="1.5" fill={CREAM} opacity=".45" />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M${36 + i * 16} 80h16v10a8 8 0 0 1-16 0Z`} fill={i % 2 ? CREAM : ORANGE} />
      ))}
      <rect x="46" y="102" width="88" height="54" rx="4" fill={CREAM} />
      <path d="M46 128H134M46 152H134" stroke={ORANGE} strokeOpacity=".35" strokeWidth="2" />
      {PRODUCTS.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill={c} />
      ))}
      <rect x="62" y="160" width="20" height="22" rx="2" fill={INK} opacity=".85" />

      {/* route from the store to the customer, with the drop pin */}
      <path d="M150 74C220 20 300 24 372 72" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round" />
      <path d="M378 34c-9 0-15 6-15 15 0 11 15 25 15 25s15-14 15-25c0-9-6-15-15-15Z" fill={ORANGE} />
      <circle cx="378" cy="49" r="6" fill={CREAM} />

      {/* the delivery on its way */}
      <ScooterRider x={182} y={94} s={1} rim={CREAM} />

      {/* customer's home with a grocery bag at the door */}
      <path d="M340 120 378 92 416 120Z" fill={ORANGE} />
      <rect x="346" y="118" width="64" height="64" rx="3" fill={PEACH} />
      <rect x="370" y="146" width="18" height="36" rx="2" fill={INK} opacity=".85" />
      <rect x="352" y="128" width="12" height="12" rx="2" fill={CREAM} />
      <rect x="394" y="128" width="12" height="12" rx="2" fill={CREAM} />
      <ellipse cx="325" cy="160" rx="7" ry="11" fill={GREEN} transform="rotate(-18 325 160)" />
      <ellipse cx="337" cy="158" rx="6" ry="10" fill="#2FBF85" transform="rotate(16 337 158)" />
      <path d="M342 160l8-14" stroke={ORANGE} strokeWidth="5" strokeLinecap="round" />
      <path d="M316 162h36l-3 20h-30Z" fill="#E9B98C" />
      <path d="M316 162h36" stroke="#C99A6E" strokeWidth="3" strokeLinecap="round" />
      <image href="/favicon.png" x="327" y="166" width="13" height="13" />
    </svg>
  )
}
