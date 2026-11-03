import { NavLink, useLocation } from 'react-router-dom'
import { NAV_GROUPS, solutionNav } from '../../data/screens'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import SidebarArt from './SidebarArt'

/* Active item: brand-tinted row and orange icon. */
const ITEM =
  'relative h-9 rounded-lg px-3 text-nav-ink hover:bg-nav-raised hover:text-nav-ink-strong ' +
  'data-active:bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] data-active:text-nav-ink-strong data-active:font-semibold data-active:hover:bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] ' +
  'data-active:[&_svg]:text-brand group-data-[collapsible=icon]:justify-center [&_svg]:size-[18px]'

export default function AppSidebar() {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarArt />
      <SidebarHeader className="relative z-10 px-3 pt-4 pb-3">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <img src="/favicon.png" alt="StorePulse AI" className="size-7 shrink-0 rounded-lg" />
          <span className="truncate text-[15.5px] font-extrabold leading-none tracking-tight text-nav-ink-strong group-data-[collapsible=icon]:hidden">
            StorePulse AI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="relative z-10 px-1">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[.08em] text-nav-ink/70">{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {solutionNav
                  .filter((n) => n.group === group)
                  .map(({ path, label, icon, activeIcon }) => {
                    const active = pathname === `/${path}`
                    const Icon = active ? activeIcon : icon
                    return (
                      <SidebarMenuItem key={path}>
                        <SidebarMenuButton tooltip={label} isActive={active} className={ITEM} render={<NavLink to={`/${path}`} />}>
                          <Icon />
                          <span className="text-[13.5px] group-data-[collapsible=icon]:hidden">{label}</span>
                          {path === 'pulse' && (
                            <span className="ml-auto rounded-full bg-brand px-1.5 py-px text-[10px] font-extrabold tracking-wide text-brand-ink group-data-[collapsible=icon]:hidden">
                              AI
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
