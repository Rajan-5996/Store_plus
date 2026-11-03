import { useLocation } from 'react-router-dom'
import { RiArrowRightSLine, RiSparkling2Fill } from '@remixicon/react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAskPulse } from '@/hooks/useAskPulse'
import { usePageTitle } from '@/hooks/usePageTitle'
import { pageMeta } from '@/lib/pageMeta'
import TopbarSearch from './TopbarSearch'
import UserChip from './UserChip'

export default function Topbar() {
  const { pathname } = useLocation()
  const { section, title } = pageMeta(pathname)
  const askPulse = useAskPulse()
  usePageTitle(title)
  return (
    <header className="top">
      <SidebarTrigger className="text-muted hover:text-ink" />
      <nav className="crumbs" aria-label="Breadcrumb">
        <span>{section}</span>
        <RiArrowRightSLine aria-hidden />
        <b aria-current="page">{title}</b>
      </nav>
      <span className="grow" />
      <TopbarSearch />
      {pathname !== '/pulse' && (
        <button className="btn solid" type="button" onClick={() => askPulse()} aria-label="Ask Pulse">
          <RiSparkling2Fill aria-hidden />
          <span className="btn-label">Ask Pulse</span>
        </button>
      )}
      <UserChip />
    </header>
  )
}
