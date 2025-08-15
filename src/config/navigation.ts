import { ComponentType } from 'react'
import {
  GridIcon,
  NoteIcon,
  ProgressIcon,
  AnalyticsIcon,
  JournalIcon,
  LightningIcon,
  ChartBarsIcon,
  GalleryIcon
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
        id: 'progress-tracker',
        icon: ProgressIcon,
        label: 'Progress Tracker',
        href: '/progress-tracker',
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
        isEnabled: false // Disabled since we removed analytics page
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
        href: '/statistics',
        tooltip: 'View trade statistics',
        isEnabled: true
      },
      {
        id: 'gallery',
        icon: GalleryIcon,
        label: 'Gallery',
        href: '/gallery',
        tooltip: 'Media gallery',
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