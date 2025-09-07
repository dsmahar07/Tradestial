'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformancePage } from '@/components/analytics/performance-page'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'

export function AnalyticsPageClient() {
  const handleTabChange = (tabId: string) => {
    // Handle tab changes here if needed
    // TODO: Implement tab change logic when navigation is needed
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    // Handle dropdown item selection
    // TODO: Implement dropdown navigation logic
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <PerformancePage />
        </main>
      </div>
    </div>
  )
}
