import { NavLink, useLocation } from 'react-router-dom'
import SidebarArt from "./SidebarArt"
import { solutionNav } from '../../data/screens'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'

export default function AppSidebar() {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarArt />
      <SidebarHeader className="relative z-10 pt-4">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <img
            src="/favicon.png"
            alt="StorePulse AI"
            className="size-6 shrink-0 rounded-[6px] ring-1 ring-[#FFF4EC]/80 group-data-[collapsible=icon]:size-6"
          />
          <span className="truncate text-[15px] font-extrabold leading-none tracking-tight text-[#FFF4EC] group-data-[collapsible=icon]:hidden">
            StorePulse AI
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="relative z-10 my-2 bg-[#FFF4EC]/35" />
      <SidebarContent className="relative z-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {solutionNav.map(({ path, label, icon, activeIcon }) => {
                const active = pathname === `/${path}`
                const Icon = active ? activeIcon : icon
                return (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton
                      tooltip={label}
                      isActive={active}
                      className="h-10 ring-0 focus-visible:ring-0 justify-start rounded-[6px] group-data-[collapsible=icon]:justify-center data-active:bg-linear-to-r data-active:from-(--surface) data-active:to-(--flow-1) data-active:text-brand data-active:hover:text-brand group-data-[state=expanded]:w-[calc(100%+0.5rem)] group-data-[state=expanded]:rounded-l-full group-data-[state=expanded]:rounded-r-none group-data-[state=expanded]:pl-4 [&_svg]:size-[18px]"
                      render={<NavLink to={`/${path}`} />}
                    >
                      <Icon />
                      <span className="text-[13px] font-semibold group-data-[collapsible=icon]:hidden">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
