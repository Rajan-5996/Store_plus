import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiSearchLine, RiStore2Line } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchStoreList } from '@/features/store/storeSlice'
import { storePath } from '@/lib/storePath'
import { solutionNav } from '../../data/screens'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Search box (Ctrl/⌘ K) that jumps to a store's page or a screen; arrow keys move through the results. */
export default function TopbarSearch() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const stores = useAppSelector((s) => s.store.list)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    if (stores.length === 0) void dispatch(fetchStoreList())
  }, [dispatch, stores.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const found = useMemo(
    () => (q ? stores.filter((s) => `${s.code} ${s.area} ${s.city}`.toLowerCase().includes(q)).slice(0, 6) : []),
    [q, stores],
  )
  const screens = useMemo(() => (q ? solutionNav.filter((s) => s.label.toLowerCase().includes(q)) : []), [q])
  const targets = [...found.map((s) => storePath(s.code)), ...screens.map((s) => `/${s.path}`)]

  const go = (path: string) => {
    navigate(path)
    setQuery('')
    setOpen(false)
    input.current?.blur()
  }

  return (
    <div className="top-search">
      <RiSearchLine className="top-search-icon" aria-hidden />
      <input
        ref={input}
        type="search"
        value={query}
        placeholder="Search stores or pages"
        aria-label="Search stores or pages"
        aria-expanded={open && !!q}
        role="combobox"
        onChange={(e) => {
          setQuery(e.target.value)
          setCursor(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, targets.length - 1))
          else if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0))
          else if (e.key === 'Enter' && targets[cursor]) go(targets[cursor])
          else if (e.key === 'Escape') {
            setOpen(false)
            input.current?.blur()
          }
        }}
      />
      {!query && <span className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>}
      {open && q && (
        <ul className="top-search-results" role="listbox">
          {targets.length === 0 && <li className="empty">No stores or pages match “{query.trim()}”</li>}
          {found.length > 0 && <li className="group">Stores</li>}
          {found.map((s, i) => (
            <li key={s.code}>
              <button type="button" role="option" aria-selected={cursor === i} className={cursor === i ? 'on' : ''} onMouseDown={() => go(storePath(s.code))}>
                <RiStore2Line className="size-4" aria-hidden />
                <span>
                  <b>{s.code}</b> {s.area}, {s.city}
                </span>
              </button>
            </li>
          ))}
          {screens.length > 0 && <li className="group">Pages</li>}
          {screens.map(({ path, label, icon: Icon }, k) => {
            const i = found.length + k
            return (
              <li key={path}>
                <button type="button" role="option" aria-selected={cursor === i} className={cursor === i ? 'on' : ''} onMouseDown={() => go(`/${path}`)}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
