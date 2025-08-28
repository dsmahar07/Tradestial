'use client'

import { Button } from "@/components/ui/button"
import { usePathname } from 'next/navigation'

export function DashboardHeader() {
  const pathname = usePathname()
  
  const getPageInfo = () => {
    switch (pathname) {
      case '/notes':
        return {
          title: 'Note',
          description: 'Your trading journal and notes'
        }
      case '/progress-tracker':
        return {
          title: 'Progress Tracker',
          description: 'Track your trading progress and milestones'
        }
      case '/daily-journal':
        return {
          title: 'Daily Journal',
          description: 'Your daily trading reflections and insights'
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
      case '/settings':
        return {
          title: 'Settings',
          description: 'Manage your account preferences and application settings'
        }
      case '/dashboard':
      default:
        return {
          title: 'Dashboard',
          description: "Here's your analytic details"
        }
    }
  }

  const { title, description } = getPageInfo()

  return (
    <header className="bg-gray-50 dark:bg-[#1C1C1C] text-gray-900 dark:text-white px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>
      </div>
    </header>
  )
}