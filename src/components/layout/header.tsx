'use client'

import { logger } from '@/lib/logger'

import { Button } from "@/components/ui/button"
import { AccountSelector } from "@/components/ui/account-selector"
import { FilterMenu, defaultFilterGroups, FilterGroup } from "@/components/ui/filter-menu"
import { AskStial } from "@/components/ui/ask-stial"
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { usePrivacy } from '@/contexts/privacy-context'

export function DashboardHeader() {
  const pathname = usePathname()
  const { displayFormat, setDisplayFormat } = usePrivacy()
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(
    defaultFilterGroups.map(group => ({
      ...group,
      value: displayFormat
    }))
  )
  
  const getPageInfo = () => {
    switch (pathname) {
      case '/notes':
        return {
          title: 'Note',
          description: 'Your trading journal and notes'
        }
      case '/activity-journal':
        return {
          title: 'Activity Journal',
          description: 'Track your trading progress and milestones'
        }
      case '/daily-journal':
        return {
          title: 'Daily Journal',
          description: 'Your daily trading reflections and insights'
        }
      case '/journal-page':
        return {
          title: 'Journal',
          description: 'Your trading journal and daily reflections'
        }
      case '/analytics':
        return {
          title: 'Analytics',
          description: 'Advanced trading analytics and performance insights'
        }
      case '/model':
        return {
          title: 'Model Builder',
          description: 'Create and manage your trading strategies'
        }
      case '/statistics':
        return {
          title: 'Trades',
          description: 'View and analyze your trading history'
        }
      case '/gallery':
        return {
          title: 'Gallery',
          description: 'Your trading charts and screenshots'
        }
      case '/trades':
        return {
          title: 'Trades',
          description: 'View and manage your trading history'
        }
      case '/trades/tracker':
        return {
          title: 'Tracker',
          description: 'Detailed view of your trading performance'
        }
      case '/import-data':
        return {
          title: 'Import Trading Data',
          description: 'Sync and import your trading data from various platforms'
        }
      case '/resources':
        return {
          title: 'Trading Resources',
          description: 'Essential tools and information for successful trading'
        }
      case '/account':
        return {
          title: 'Account Management',
          description: 'Manage your trading accounts and view performance summaries'
        }
      case '/settings':
        return {
          title: 'Settings',
          description: 'Manage your account preferences and application settings'
        }
      case '/dashboard':
      default:
        if (pathname.startsWith('/trades/tracker/')) {
          return {
            title: 'Tracker',
            description: 'Detailed view of your trading performance'
          }
        }
        return {
          title: 'Dashboard',
          description: ''
        }
    }
  }

  const { title, description } = getPageInfo()

  const handleAccountChange = (accountId: string) => {
    // Account switching is handled by the AccountSelector component
    // Analytics will automatically update through the DataStore sync
    logger.debug('Switched to account:', accountId)
  }

  const handleFilterChange = (groupId: string, value: string) => {
    setFilterGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, value }
          : group
      )
    )
    // Update privacy context when filter changes
    setDisplayFormat(value)
    logger.debug('Filter changed:', groupId, value)
  }

  // Determine if filters should be shown based on current page
  const shouldShowFilters = () => {
    return pathname === '/dashboard'
  }

  return (
    <header className="bg-[#f8f9f8] dark:bg-[#171717] px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl"><span className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">{title}</span></h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <AskStial />
          {shouldShowFilters() && (
            <FilterMenu 
              groups={filterGroups.map(group => ({
                ...group,
                onChange: (value: string) => handleFilterChange(group.id, value)
              }))}
            />
          )}
          <AccountSelector onAccountChange={handleAccountChange} />
        </div>
      </div>
    </header>
  )
}