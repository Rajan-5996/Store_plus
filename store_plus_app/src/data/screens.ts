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
  RiStackFill,
  RiStackLine,
  type RemixiconComponentType,
} from '@remixicon/react'

export interface NavItem {
  path: string
  label: string
  icon: RemixiconComponentType
  /** Filled variant shown for the active page. */
  activeIcon: RemixiconComponentType
}

export const solutionNav: NavItem[] = [
  { path: 'overview', label: 'Network overview', icon: RiDashboardLine, activeIcon: RiDashboardFill },
  { path: 'utilisation', label: 'Store utilisation', icon: RiDashboard3Line, activeIcon: RiDashboard3Fill },
  { path: 'inventory', label: 'Inventory intelligence', icon: RiBox3Line, activeIcon: RiBox3Fill },
  { path: 'operations', label: 'Operational efficiency', icon: RiSettings3Line, activeIcon: RiSettings3Fill },
  { path: 'profitability', label: 'Store profitability', icon: RiMoneyRupeeCircleLine, activeIcon: RiMoneyRupeeCircleFill },
  { path: 'network', label: 'Network optimisation', icon: RiMapPin2Line, activeIcon: RiMapPin2Fill },
  { path: 'productmix', label: 'Product mix', icon: RiStackLine, activeIcon: RiStackFill },
  { path: 'transfers', label: 'Transfer log', icon: RiArrowLeftRightLine, activeIcon: RiArrowLeftRightFill },
]
