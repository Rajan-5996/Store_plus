import {
  RiArrowLeftRightFill,
  RiArrowLeftRightLine,
  RiBox3Fill,
  RiBox3Line,
  RiDashboard3Fill,
  RiDashboard3Line,
  RiDashboardFill,
  RiDashboardLine,
  RiMapPin2Fill,
  RiMapPin2Line,
  RiMoneyRupeeCircleFill,
  RiMoneyRupeeCircleLine,
  RiSettings3Fill,
  RiSettings3Line,
  RiSparkling2Fill,
  RiSparkling2Line,
  RiStackFill,
  RiStackLine,
  type RemixiconComponentType,
} from '@remixicon/react'

/** Sidebar sections, in display order. */
export const NAV_GROUPS = ['Intelligence solutions', 'AI assistant', 'Execution'] as const
export type NavGroup = (typeof NAV_GROUPS)[number]

export interface NavItem {
  path: string
  label: string
  group: NavGroup
  icon: RemixiconComponentType
  /** Filled variant shown for the active page. */
  activeIcon: RemixiconComponentType
}

const I: NavGroup = 'Intelligence solutions'

export const solutionNav: NavItem[] = [
  { path: 'overview', label: 'Network overview', group: I, icon: RiDashboardLine, activeIcon: RiDashboardFill },
  { path: 'utilisation', label: 'Store utilisation', group: I, icon: RiDashboard3Line, activeIcon: RiDashboard3Fill },
  { path: 'inventory', label: 'Inventory intelligence', group: I, icon: RiBox3Line, activeIcon: RiBox3Fill },
  { path: 'operations', label: 'Operational efficiency', group: I, icon: RiSettings3Line, activeIcon: RiSettings3Fill },
  { path: 'profitability', label: 'Store profitability', group: I, icon: RiMoneyRupeeCircleLine, activeIcon: RiMoneyRupeeCircleFill },
  { path: 'network', label: 'Network optimisation', group: I, icon: RiMapPin2Line, activeIcon: RiMapPin2Fill },
  { path: 'productmix', label: 'Product mix', group: I, icon: RiStackLine, activeIcon: RiStackFill },
  { path: 'pulse', label: 'Pulse AI', group: 'AI assistant', icon: RiSparkling2Line, activeIcon: RiSparkling2Fill },
  { path: 'transfers', label: 'Transfer log', group: 'Execution', icon: RiArrowLeftRightLine, activeIcon: RiArrowLeftRightFill },
]
