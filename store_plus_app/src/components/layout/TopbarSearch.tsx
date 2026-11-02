import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiSearchLine } from '@remixicon/react'
import { solutionNav } from '../../data/screens'

/** Search box that jumps to a screen by name. */
export default function TopbarSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? solutionNav.filter((s) => s.label.toLowerCase().includes(q)) : []
  }, [query])

  const go = (path: string) => {
    navigate(`/${path}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="top-search">
      <RiSearchLine className="top-search-icon" aria-hidden />
      <input
        type="search"
        value={query}
        placeholder="Search stores, screens, metrics…"
        aria-label="Search"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) go(matches[0].path)
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && query.trim() && (
        <ul className="top-search-results" role="listbox">
          {matches.length === 0 && <li className="empty">No matching screens</li>}
          {matches.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <button type="button" role="option" onMouseDown={() => go(path)}>
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
