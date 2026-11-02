import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiSearchLine, RiStore2Line } from '@remixicon/react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchStoreList } from '@/features/store/storeSlice'
import { storePath } from '@/lib/storePath'
import { solutionNav } from '../../data/screens'

/** Search box that jumps to a screen or a store's page. */
export default function TopbarSearch() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const stores = useAppSelector((s) => s.store.list)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (stores.length === 0) void dispatch(fetchStoreList())
  }, [dispatch, stores.length])

  const q = query.trim().toLowerCase()
  const screens = useMemo(() => (q ? solutionNav.filter((s) => s.label.toLowerCase().includes(q)) : []), [q])
  const found = useMemo(
    () =>
      q
        ? stores.filter((s) => `${s.code} ${s.area} ${s.city}`.toLowerCase().includes(q)).slice(0, 6)
        : [],
    [q, stores],
  )
  const none = screens.length === 0 && found.length === 0

  const go = (path: string) => {
    navigate(path.startsWith('/') ? path : `/${path}`)
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
          if (e.key === 'Enter' && found[0]) go(storePath(found[0].code))
          else if (e.key === 'Enter' && screens[0]) go(screens[0].path)
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && q && (
        <ul className="top-search-results" role="listbox">
          {none && <li className="empty">No matching stores or screens</li>}
          {found.map((s) => (
            <li key={s.code}>
              <button type="button" role="option" onMouseDown={() => go(storePath(s.code))}>
                <RiStore2Line className="size-4" aria-hidden />
                {s.code} · {s.area}, {s.city}
              </button>
            </li>
          ))}
          {screens.map(({ path, label, icon: Icon }) => (
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
