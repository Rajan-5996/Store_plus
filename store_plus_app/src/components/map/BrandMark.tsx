import { brandStyle } from '@/data/competitors'

/** A rival brand's tag (B, Z, …) in its brand colours; `pin` is the diamond drawn on the map, otherwise a small square. */
export default function BrandMark({ brand, pin = false }: { brand: string; pin?: boolean }) {
  const s = brandStyle(brand)
  if (pin)
    return (
      <div className="grid size-5 rotate-45 place-items-center rounded-[5px] border-2 border-[#FFF4EC] shadow-md" style={{ background: s.bg }}>
        <span className="-rotate-45 text-[9px] font-extrabold leading-none" style={{ color: s.fg }}>
          {s.tag}
        </span>
      </div>
    )
  return (
    <i
      className="grid size-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-extrabold not-italic leading-none"
      style={{ background: s.bg, color: s.fg }}
      aria-hidden
    >
      {s.tag}
    </i>
  )
}
