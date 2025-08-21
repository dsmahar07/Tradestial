'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformancePage } from '@/components/analytics/performance-page'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'

export default function AnalyticsPage() {
  usePageTitle('Analytics')
  
  const handleTabChange = (tabId: string) => {
    // Handle tab changes here if needed
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    // Handle dropdown item selection
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#171717]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#1C1C1C]">
          <PerformancePage />
        </main>
      </div>
    </div>
  )
}
