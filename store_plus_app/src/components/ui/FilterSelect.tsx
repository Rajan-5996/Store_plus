import { useState, type ComponentType } from 'react'
import { RiArrowDownSLine, RiCheckLine } from '@remixicon/react'

interface Props {
  label: string
  options: string[]
  defaultValue?: string
  icon?: ComponentType<{ className?: string }>
  onChange?: (value: string) => void
}

/** Theme-styled dropdown (replaces the native <select>). */
export default function FilterSelect({ label, options, defaultValue, icon: Icon, onChange }: Props) {
  const [value, setValue] = useState(defaultValue ?? options[0])
  const [open, setOpen] = useState(false)

  const pick = (o: string) => {
    setValue(o)
    setOpen(false)
    onChange?.(o)
  }

  return (
    <div
      className="fs"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <button
        type="button"
        className="fs-btn"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {Icon && <Icon className="fs-icon" />}
        <span>{value}</span>
        <RiArrowDownSLine className={`fs-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <ul className="fs-menu" role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={o} role="option" aria-selected={o === value}>
              <button type="button" className={o === value ? 'on' : ''} onClick={() => pick(o)}>
                <span>{o}</span>
                {o === value && <RiCheckLine className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
