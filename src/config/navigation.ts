import { ComponentType } from 'react'
import {
  GridIcon,
  NoteIcon,
  ProgressIcon,
  AnalyticsIcon,
  JournalIcon,
  LightningIcon,
  ChartBarsIcon,
  GalleryIcon,
  CalendarIcon
} from '@/components/icons/mageicons'

export interface NavigationItem {
  id: string
  icon: ComponentType<{ className?: string; size?: number }>
  label: string
  href: string
  badge?: boolean
  isActive?: (pathname: string) => boolean
  tooltip?: string
  isEnabled?: boolean
}

export interface NavigationSection {
  id: string
  title?: string
  items: NavigationItem[]
}

export const navigationConfig: NavigationSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        icon: GridIcon,
        label: 'Dashboard',
        href: '/dashboard',
        tooltip: 'View your trading dashboard',
        isEnabled: true
      },
      {
        id: 'notes',
        icon: NoteIcon,
        label: 'Note',
        href: '/notes',
        tooltip: 'Manage your trading notes',
        isEnabled: true
      },
      {
        id: 'activity-journal',
        icon: ProgressIcon,
        label: 'Activity Journal',
        href: '/activity-journal',
        tooltip: 'Track your trading progress',
        isEnabled: true
      },
      {
        id: 'analytics',
        icon: AnalyticsIcon,
        label: 'Analytics',
        href: '/analytics',
        badge: true,
        tooltip: 'Advanced analytics and reports',
        isEnabled: true
      },
      {
        id: 'daily-journal',
        icon: JournalIcon,
        label: 'Daily Journal',
        href: '/daily-journal',
        badge: true,
        tooltip: 'Your daily trading journal',
        isEnabled: true
      },
      {
        id: 'model',
        icon: LightningIcon,
        label: 'Model',
        href: '/model',
        tooltip: 'Trading models and strategies',
        isEnabled: true
      },
      {
        id: 'trades',
        icon: ChartBarsIcon,
        label: 'Trades',
        href: '/trades',
        tooltip: 'View and manage your trades',
        isEnabled: true
      },
      {
        id: 'gallery',
        icon: GalleryIcon,
        label: 'Gallery',
        href: '/gallery',
        tooltip: 'Media gallery',
        isEnabled: true
      },
      {
        id: 'resources',
        icon: CalendarIcon,
        label: 'Resources',
        href: '/resources',
        tooltip: 'Trading resources and tools',
        isEnabled: true
      }
    ]
  }
]

export const getEnabledNavigationItems = (): NavigationItem[] => {
  return navigationConfig
    .flatMap(section => section.items)
    .filter(item => item.isEnabled !== false)
}

export const getNavigationItemByPath = (pathname: string): NavigationItem | undefined => {
  return navigationConfig
    .flatMap(section => section.items)
    .find(item => item.href === pathname || (item.isActive && item.isActive(pathname)))
}