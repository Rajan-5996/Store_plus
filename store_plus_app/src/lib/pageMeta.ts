import { solutionNav } from '@/data/screens'

export interface PageMeta {
  /** Section shown before the page in the breadcrumb and as the page eyebrow. */
  section: string
  title: string
}

/** Section and title of the page at a route path ("/inventory", "/store/524"). */
export function pageMeta(pathname: string): PageMeta {
  const store = pathname.match(/^\/store\/(\d+)/)
  if (store) return { section: 'Stores', title: `Store #${store[1]}` }
  const nav = solutionNav.find((n) => pathname === `/${n.path}`)
  return nav ? { section: nav.group, title: nav.label } : { section: 'Intelligence solutions', title: 'Network overview' }
}
