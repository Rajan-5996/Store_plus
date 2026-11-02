import type { CSSProperties } from 'react'
import { useUI } from '../../context/UIContext'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { RiSparkling2Fill } from '@remixicon/react'
import TopbarSearch from './TopbarSearch'

export default function Topbar() {
  const { openDrawer } = useUI()
  const progress = useScrollProgress()
  return (
    <header className="top" style={{ '--p': progress } as CSSProperties}>
      <SidebarTrigger />
      <TopbarSearch />
      <span className="grow" />
      <button className="btn solid gap-1.5" type="button" onClick={openDrawer}><RiSparkling2Fill className="size-4 text-brand [.btn:hover_&]:text-[var(--brand-ink)]" aria-hidden />Ask Pulse</button>
    </header>
  )
}
