export interface DropdownItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface AnalyticsTab {
  id: string
  label: string
  href?: string
  isNew?: boolean
  hasDropdown?: boolean
  isActive?: boolean
  dropdownItems?: DropdownItem[]
}

export const reportsDropdownItems: DropdownItem[] = [
  {
    id: 'day-time',
    label: 'Day & Time',
    href: '/analytics/reports/day-time'
  },
  {
    id: 'symbols',
    label: 'Symbols',
    href: '/analytics/reports/symbols'
  },
  {
    id: 'risk',
    label: 'Risk',
    href: '/analytics/reports/risk'
  },
  {
    id: 'models',
    label: 'Models',
    href: '/analytics/reports/models'
  },
  {
    id: 'tags',
    label: 'Tags',
    href: '/analytics/reports/tags'
  },
  {
    id: 'options-expiration',
    label: 'Options: Days till expiration',
    href: '/analytics/reports/options-expiration'
  },
  {
    id: 'wins-losses',
    label: 'Wins vs Losses',
    href: '/analytics/reports/wins-losses'
  }
]

export const analyticsNavigationConfig: AnalyticsTab[] = [
  {
    id: 'performance',
    label: 'Performance',
    href: '/analytics',
    isActive: true
  },
  {
    id: 'overview',
    label: 'Overview',
    href: '/analytics/overview'
  },
  {
    id: 'reports',
    label: 'Reports',
    hasDropdown: true,
    dropdownItems: reportsDropdownItems
  },
  {
    id: 'compare',
    label: 'Compare',
    href: '/analytics/compare'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/analytics/calendar'
  }
]
